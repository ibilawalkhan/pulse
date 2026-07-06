output "alb_dns_name" {
  description = "Public DNS name of the load balancer."
  value       = aws_lb.main.dns_name
}

output "app_url" {
  description = "The application URL."
  value       = "https://${var.domain_name}"
}

output "ecr_repository_urls" {
  description = "ECR repository URLs per service."
  value       = { for k, r in aws_ecr_repository.service : k => r.repository_url }
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "sqs_queue_url" {
  description = "check-jobs queue URL."
  value       = aws_sqs_queue.check_jobs.url
}

output "deploy_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions via OIDC."
  value       = aws_iam_role.deploy.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint."
  value       = aws_db_instance.main.endpoint
}

output "public_subnet_ids" {
  description = "Public subnet ids (for the one-off migration task)."
  value       = aws_subnet.public[*].id
}

output "service_security_group_id" {
  description = "Service security group id (for the one-off migration task)."
  value       = aws_security_group.service.id
}

output "api_task_definition_family" {
  description = "Family of the api task definition (used to run migrations)."
  value       = aws_ecs_task_definition.api.family
}
