# Log groups (one per service) and the four "observability of the observer"
# alarms, delivered to an SNS email topic.

resource "aws_cloudwatch_log_group" "service" {
  for_each          = toset(local.services)
  name              = "/ecs/${local.name}-${each.key}"
  retention_in_days = var.log_retention_days
}

resource "aws_sns_topic" "alarms" {
  name = "${local.name}-alarms"
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "queue_backlog" {
  alarm_name          = "${local.name}-worker-queue-backlog"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  statistic           = "Maximum"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 100
  period              = 60
  evaluation_periods  = 5
  dimensions          = { QueueName = aws_sqs_queue.check_jobs.name }
  alarm_actions       = [aws_sns_topic.alarms.arn]
  alarm_description   = "check-jobs backlog > 100 for 5 minutes"
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  alarm_name          = "${local.name}-dlq-not-empty"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  statistic           = "Maximum"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  period              = 60
  evaluation_periods  = 1
  dimensions          = { QueueName = aws_sqs_queue.check_jobs_dlq.name }
  alarm_actions       = [aws_sns_topic.alarms.arn]
  alarm_description   = "Poison messages have landed in the DLQ"
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${local.name}-api-5xx"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 10
  period              = 300
  evaluation_periods  = 1
  treat_missing_data  = "notBreaching"
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }
  alarm_actions     = [aws_sns_topic.alarms.arn]
  alarm_description = "API returned > 10 5xx responses in 5 minutes"
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name}-rds-cpu"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 80
  period              = 300
  evaluation_periods  = 2
  dimensions          = { DBInstanceIdentifier = aws_db_instance.main.identifier }
  alarm_actions       = [aws_sns_topic.alarms.arn]
  alarm_description   = "RDS CPU > 80% for 10 minutes"
}
