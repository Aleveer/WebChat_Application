#######################################
## IAM role + Lambda backend
#######################################

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${var.project_name}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = var.default_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Quyền S3 + DynamoDB tối thiểu cho backend (tùy chỉnh thêm nếu cần).
data "aws_iam_policy_document" "lambda_app" {
  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]

    resources = ["${aws_s3_bucket.uploads.arn}/*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchWriteItem",
      "dynamodb:BatchGetItem",
    ]

    resources = [
      aws_dynamodb_table.users.arn,
      aws_dynamodb_table.conversations.arn,
      aws_dynamodb_table.messages.arn,
      aws_dynamodb_table.groups.arn,
      aws_dynamodb_table.files.arn,
      aws_dynamodb_table.notifications.arn,
      aws_dynamodb_table.analytics_events.arn,
    ]
  }
}

resource "aws_iam_policy" "lambda_app" {
  name   = "${var.project_name}-lambda-app"
  policy = data.aws_iam_policy_document.lambda_app.json
}

resource "aws_iam_role_policy_attachment" "lambda_app" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_app.arn
}

resource "aws_lambda_function" "backend" {
  function_name = "${var.project_name}-backend"
  role          = aws_iam_role.lambda_exec.arn

  package_type = "Image"
  # Sử dụng image từ ECR repo vừa tạo, với tag cấu hình qua biến backend_image_tag.
  image_uri = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

  # Khớp với kiến trúc của image (build linux/amd64).
  architectures = ["x86_64"]

  timeout     = 30
  memory_size = 512

  environment {
    variables = {
      NODE_ENV    = var.node_env
      PORT        = "3000" # NestJS thường không dùng trong Lambda, nhưng giữ để tương thích.
      MONGODB_URI = var.mongodb_uri

      # Database: app sẽ dùng multi-table, nên truyền tên từng bảng để code backend sử dụng.
      DYNAMODB_USERS_TABLE            = aws_dynamodb_table.users.name
      DYNAMODB_CONVERSATIONS_TABLE    = aws_dynamodb_table.conversations.name
      DYNAMODB_MESSAGES_TABLE         = aws_dynamodb_table.messages.name
      DYNAMODB_GROUPS_TABLE           = aws_dynamodb_table.groups.name
      DYNAMODB_FILES_TABLE            = aws_dynamodb_table.files.name
      DYNAMODB_NOTIFICATIONS_TABLE    = aws_dynamodb_table.notifications.name
      DYNAMODB_ANALYTICS_EVENTS_TABLE = aws_dynamodb_table.analytics_events.name

      # JWT
      JWT_SECRET             = var.jwt_secret
      JWT_EXPIRES_IN         = var.jwt_expires_in
      JWT_REFRESH_EXPIRES_IN = var.jwt_refresh_expires_in

      # S3
      UPLOADS_BUCKET_NAME = aws_s3_bucket.uploads.bucket

      # Email (SMTP)
      EMAIL_HOST   = var.email_host
      EMAIL_PORT   = tostring(var.email_port)
      EMAIL_SECURE = tostring(var.email_secure)
      EMAIL_PASS   = var.email_pass
      EMAIL_USER   = var.email_user

      # # Cognito (dùng khi bạn chuyển sang verify token từ Cognito)
      # COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
      # COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.main.id
      # COGNITO_REGION       = var.aws_region
    }
  }

  tags = var.default_tags
}


