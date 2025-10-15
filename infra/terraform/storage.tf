resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-${random_id.bucket_hex.hex}"
}

resource "random_id" "bucket_hex" {
  byte_length = 4
}

resource "aws_dynamodb_table" "sessions" {
  name         = "${var.project_name}-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }
}
