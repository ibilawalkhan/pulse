# Generated credentials, stored in Secrets Manager and injected into tasks.
# Nothing sensitive is committed; values are created by Terraform at apply time.

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "random_password" "jwt_access" {
  length  = 48
  special = true
}

resource "random_password" "jwt_refresh" {
  length  = 48
  special = true
}

resource "aws_secretsmanager_secret" "app" {
  name        = "${local.name}-app"
  description = "Pulse application secrets (DB URL + JWT signing keys)"
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    DATABASE_URL       = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.main.address}:5432/${var.db_name}?schema=public"
    JWT_SECRET         = random_password.jwt_access.result
    JWT_REFRESH_SECRET = random_password.jwt_refresh.result
  })
}
