project_name = "webchat-app-dev"

aws_region = "ap-southeast-2"

mongodb_uri         = "mongodb+srv://aleveer:1234Danh123@webchat-dev.e73eflc.mongodb.net/?appName=webchat-dev"
uploads_bucket_name = "webchat-app-dev-uploads-2025-sg123456"
backend_image_tag   = "latest"
node_env            = "production"

#JWT Secret
jwt_secret             = "549846f22e47511c5415eecff0887aff81a28efac157cfae08336c78d8687ea77ba0f951cd7e92466b81e5b679c7e2f426f9c77ab0c8b75508b8ce2d8b2fa9ea"
jwt_expires_in         = "7d"
jwt_refresh_expires_in = "30d"

#Email SMTP
email_host   = "smtp.gmail.com"
email_port   = 587
email_secure = false
email_user   = "danhanh.nguyen1643@gmail.com"
email_pass   = "mqjr ksei iufy ljcr"


############################
# Cognito Hosted UI (tạm để dev/local)
############################

# Tùy chọn: nếu bạn dùng Cognito Hosted UI / OAuth
# Có thể để là URL frontend dev / test
# cognito_callback_urls = [
#   "http://localhost:5173/callback",
# ]

# cognito_logout_urls = [
#   "http://localhost:5173/logout",
# ]

default_tags = {
  managed-by = "terraform"
  env        = "dev"
  app        = "webchat-app"
}
