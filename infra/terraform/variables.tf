variable "project_name" {
  description = "Tên dự án, dùng để prefix tài nguyên."
  type        = string
  default     = "webchat-app"
}

variable "aws_region" {
  description = "AWS region để deploy."
  type        = string
  default     = "ap-southeast-2"
}

variable "uploads_bucket_name" {
  description = "Tên S3 bucket dùng để lưu uploads."
  type        = string
}

variable "backend_image_tag" {
  description = "Tag của Docker image backend trên ECR (ví dụ: latest, dev, v1)."
  type        = string
  default     = "latest"
}

variable "node_env" {
  description = "Giá trị NODE_ENV cho backend."
  type        = string
  default     = "production"
}

variable "jwt_secret" {
  description = "JWT secret nếu bạn vẫn dùng JWT tự ký trong backend."
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "Thời gian hết hạn access token JWT."
  type        = string
  default     = "7d"
}

variable "jwt_refresh_expires_in" {
  description = "Thời gian hết hạn refresh token JWT."
  type        = string
  default     = "30d"
}

variable "cognito_callback_urls" {
  description = "Danh sách callback URL cho Cognito Hosted UI (VD: URL frontend)."
  type        = list(string)
  default     = []
}

variable "cognito_logout_urls" {
  description = "Danh sách logout URL cho Cognito Hosted UI."
  type        = list(string)
  default     = []
}

variable "default_tags" {
  description = "Tags chung áp dụng cho tất cả tài nguyên."
  type        = map(string)
  default = {
    managed-by = "terraform"
  }
}

variable "mongodb_uri" {
  description = "URI của MongoDB cho backend."
  type        = string
}

# Danh sách email nhận cảnh báo AWS Budgets (vượt ngưỡng chi phí)
variable "budget_alert_emails" {
  description = "Danh sách email sẽ nhận alert khi chi phí AWS vượt ngưỡng budget."
  type        = list(string)
  default     = ["nguyenngocthanhdai2003@gmail.com"]
}

#mail smtp:
variable "email_host" {
  description = "Host của SMTP server."
  type        = string
}

variable "email_port" {
  description = "Port của SMTP server."
  type        = number
}

variable "email_secure" {
  description = "Có sử dụng SSL không."
  type        = bool
}

variable "email_user" {
  description = "Tài khoản email."
  type        = string
}

variable "email_pass" {
  description = "Mật khẩu email."
  type        = string
  sensitive   = true
}
