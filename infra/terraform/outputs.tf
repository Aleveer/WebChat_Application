#######################################
## Outputs
#######################################

output "uploads_bucket_name" {
  value       = aws_s3_bucket.uploads.bucket
  description = "Tên S3 bucket dùng để lưu uploads."
}

output "lambda_backend_arn" {
  value       = aws_lambda_function.backend.arn
  description = "ARN của Lambda backend."
}

output "backend_ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "URL của ECR repository chứa backend image (dùng để build/push Docker)."
}

output "http_api_endpoint" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "Endpoint HTTP API Gateway trỏ vào Lambda backend."
}

# output "cognito_user_pool_id" {
#   value       = aws_cognito_user_pool.main.id
#   description = "ID của Cognito User Pool."
# }

# output "cognito_user_pool_client_id" {
#   value       = aws_cognito_user_pool_client.main.id
#   description = "Client ID của Cognito App Client."
# }
