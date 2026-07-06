data "aws_caller_identity" "current" {}

locals {
  ecs_assume = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# --- Task execution role (shared): pull images, read secrets, write logs -----

resource "aws_iam_role" "execution" {
  name               = "${local.name}-ecs-execution"
  assume_role_policy = local.ecs_assume
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  name = "read-app-secrets"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.app.arn]
    }]
  })
}

# --- Per-service task roles (least privilege) --------------------------------

# api: no AWS permissions beyond the execution role.
resource "aws_iam_role" "api" {
  name               = "${local.name}-task-api"
  assume_role_policy = local.ecs_assume
}

# scheduler: enqueue to the check-jobs queue only.
resource "aws_iam_role" "scheduler" {
  name               = "${local.name}-task-scheduler"
  assume_role_policy = local.ecs_assume
}

resource "aws_iam_role_policy" "scheduler" {
  name = "sqs-send"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage", "sqs:SendMessageBatch", "sqs:GetQueueUrl", "sqs:GetQueueAttributes"]
      Resource = [aws_sqs_queue.check_jobs.arn]
    }]
  })
}

# worker: consume the queue + send email via SES.
resource "aws_iam_role" "worker" {
  name               = "${local.name}-task-worker"
  assume_role_policy = local.ecs_assume
}

resource "aws_iam_role_policy" "worker" {
  name = "sqs-consume-ses-send"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility",
        ]
        Resource = [aws_sqs_queue.check_jobs.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = ["*"]
      },
    ]
  })
}

# --- GitHub OIDC deploy role -------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "deploy" {
  name = "${local.name}-github-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
        StringLike   = { "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*" }
      }
    }]
  })
}

resource "aws_iam_role_policy" "deploy" {
  name = "deploy"
  role = aws_iam_role.deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ]
        Resource = [for r in aws_ecr_repository.service : r.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:RegisterTaskDefinition",
          "ecs:DeregisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:RunTask",
          "ecs:DescribeTasks",
        ]
        Resource = ["*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [aws_iam_role.execution.arn, aws_iam_role.api.arn, aws_iam_role.scheduler.arn, aws_iam_role.worker.arn]
      },
    ]
  })
}
