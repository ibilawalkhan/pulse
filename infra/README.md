# Infrastructure (Terraform)

Terraform configuration for the Pulse AWS deployment lands in **milestone M3**
(README §5 and §12). Files to come: `main.tf`, `vpc.tf`, `ecs.tf`, `alb.tf`,
`rds.tf`, `sqs.tf`, `ecr.tf`, `iam.tf`, `cloudwatch.tf`, `secrets.tf`,
`route53.tf`, `variables.tf`, `outputs.tf`.

`infra/localstack/init/` holds the LocalStack bootstrap script that creates the
local SQS queue + DLQ for `docker compose up`.
