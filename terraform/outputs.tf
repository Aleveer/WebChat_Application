output "uploads_bucket_name" {
  value       = aws_s3_bucket.uploads.bucket
  description = "Tên S3 bucket dùng để lưu uploads."
}

output "backend_ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "URL của ECR repository chứa backend image (dùng để build/push Docker)."
}

output "alb_dns_name" {
  value       = aws_lb.app_alb.dns_name
  description = "DNS name của Application Load Balancer - dùng cho API_BASE_URL & SOCKET_URL phía frontend."
}

# output "cognito_user_pool_id" {
#   value       = aws_cognito_user_pool.main.id
#   description = "ID của Cognito User Pool."
# }

# output "cognito_user_pool_client_id" {
#   value       = aws_cognito_user_pool_client.main.id
#   description = "Client ID của Cognito App Client."
# }
