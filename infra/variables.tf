variable "project" {
  description = "Project name, used as a resource name prefix."
  type        = string
  default     = "pulse"
}

variable "environment" {
  description = "Deployment environment (e.g. prod, staging)."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-southeast-2"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Fully-qualified domain the app is served at (e.g. pulse.com)."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone id that owns domain_name."
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "Postgres database name."
  type        = string
  default     = "pulse"
}

variable "db_username" {
  description = "Postgres master username."
  type        = string
  default     = "pulse"
}

variable "image_tag" {
  description = "Container image tag to deploy (git SHA). Set by the CD pipeline."
  type        = string
  default     = "latest"
}

variable "ses_from_address" {
  description = "Verified SES sender address for alert emails."
  type        = string
}

variable "alarm_email" {
  description = "Email address that receives CloudWatch alarm notifications."
  type        = string
}

variable "github_repository" {
  description = "owner/repo allowed to assume the deploy role via GitHub OIDC."
  type        = string
  default     = "ibilawalkhan/pulse"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days."
  type        = number
  default     = 30
}
