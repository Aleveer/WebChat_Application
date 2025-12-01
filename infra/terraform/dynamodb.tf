# 1. Users table – lưu thông tin người dùng
resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-users"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-users"
    }
  )
}

# 2. Conversations table – thay cho conversation collection
resource "aws_dynamodb_table" "conversations" {
  name         = "${var.project_name}-conversations"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-conversations"
    }
  )
}

# 3. Messages table – thay cho messages collection
resource "aws_dynamodb_table" "messages" {
  name         = "${var.project_name}-messages"
  billing_mode = "PAY_PER_REQUEST"

  # Partition theo conversationId, sort theo createdAt (ISO string hoặc timestamp)
  hash_key  = "conversationId"
  range_key = "createdAt"

  attribute {
    name = "conversationId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-messages"
    }
  )
}

# 4. Groups table – thay cho groups collection
resource "aws_dynamodb_table" "groups" {
  name         = "${var.project_name}-groups"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-groups"
    }
  )
}

# 5. Files table – thay cho files collection
resource "aws_dynamodb_table" "files" {
  name         = "${var.project_name}-files"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # Gợi ý: có thể thêm GSI cho uploaded_by hoặc file_type nếu cần

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-files"
    }
  )
}

# 6. Notifications table
resource "aws_dynamodb_table" "notifications" {
  name         = "${var.project_name}-notifications"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-notifications"
    }
  )
}

# 7. Analytics events table – log sự kiện
resource "aws_dynamodb_table" "analytics_events" {
  name         = "${var.project_name}-analytics-events"
  billing_mode = "PAY_PER_REQUEST"

  # Partition theo user_id, sort theo createdAt
  hash_key  = "user_id"
  range_key = "createdAt"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-analytics-events"
    }
  )
}


