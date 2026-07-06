# ECS Fargate cluster with three services: api (behind the ALB), scheduler
# (singleton) and worker (scales on queue depth). Tasks run in public subnets
# with public IPs (NAT-less) behind the service security group.

resource "aws_ecs_cluster" "main" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

locals {
  common_env = [
    { name = "AWS_REGION", value = var.aws_region },
    { name = "SQS_QUEUE_URL", value = aws_sqs_queue.check_jobs.url },
    { name = "NODE_ENV", value = "production" },
    { name = "LOG_LEVEL", value = "info" },
    { name = "SES_FROM_ADDRESS", value = var.ses_from_address },
  ]

  db_secret = [
    { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.app.arn}:DATABASE_URL::" },
  ]

  jwt_secrets = [
    { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.app.arn}:JWT_SECRET::" },
    { name = "JWT_REFRESH_SECRET", valueFrom = "${aws_secretsmanager_secret.app.arn}:JWT_REFRESH_SECRET::" },
  ]

  image = { for k, r in aws_ecr_repository.service : k => "${r.repository_url}:${var.image_tag}" }
}

# Reusable awslogs config per service.
locals {
  log_config = { for s in local.services : s => {
    logDriver = "awslogs"
    options = {
      "awslogs-group"         = aws_cloudwatch_log_group.service[s].name
      "awslogs-region"        = var.aws_region
      "awslogs-stream-prefix" = s
    }
  } }
}

# --- api ---------------------------------------------------------------------

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.api.arn

  container_definitions = jsonencode([{
    name             = "api"
    image            = local.image["api"]
    essential        = true
    portMappings     = [{ containerPort = 3000 }]
    environment      = concat(local.common_env, [{ name = "API_PORT", value = "3000" }])
    secrets          = concat(local.db_secret, local.jwt_secrets)
    logConfiguration = local.log_config["api"]
  }])
}

resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  health_check_grace_period_seconds = 60
  depends_on                        = [aws_lb_listener.https]
}

# --- scheduler (singleton) ---------------------------------------------------

resource "aws_ecs_task_definition" "scheduler" {
  family                   = "${local.name}-scheduler"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.scheduler.arn

  container_definitions = jsonencode([{
    name      = "scheduler"
    image     = local.image["scheduler"]
    essential = true
    environment = concat(local.common_env, [
      { name = "SCHEDULER_INTERVAL_MS", value = "60000" },
      { name = "RETENTION_DAYS", value = "30" },
    ])
    secrets          = local.db_secret
    logConfiguration = local.log_config["scheduler"]
  }])
}

resource "aws_ecs_service" "scheduler" {
  name            = "scheduler"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.scheduler.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = true
  }
}

# --- worker (scales on queue depth) ------------------------------------------

resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.name}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.worker.arn

  container_definitions = jsonencode([{
    name      = "worker"
    image     = local.image["worker"]
    essential = true
    environment = concat(local.common_env, [
      { name = "CHECK_DEFAULT_TIMEOUT_MS", value = "10000" },
    ])
    secrets          = local.db_secret
    logConfiguration = local.log_config["worker"]
  }])
}

resource "aws_ecs_service" "worker" {
  name            = "worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = true
  }
}
