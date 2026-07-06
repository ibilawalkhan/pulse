# check-jobs queue + dead-letter queue with a redrive policy (3 receives → DLQ).

resource "aws_sqs_queue" "check_jobs_dlq" {
  name                      = "${local.name}-check-jobs-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "check_jobs" {
  name                       = "${local.name}-check-jobs"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.check_jobs_dlq.arn
    maxReceiveCount     = 3
  })
}
