# Tổng chi tiêu hàng tháng (ALL services)
resource "aws_budgets_budget" "monthly_cost" {
  name         = "monthly-cost"
  limit_amount = 120
  budget_type  = "COST"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold           = 80
    threshold_type      = "PERCENTAGE"
    notification_type   = "ACTUAL"

    subscriber_email_addresses = var.budget_alert_emails
  }
}

# Tổng chi tiêu theo ngày (ALL services)
resource "aws_budgets_budget" "daily_cost" {
  name         = "daily-cost"
  limit_amount = 3
  budget_type  = "COST"
  limit_unit   = "USD"
  time_unit    = "DAILY"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold           = 80
    threshold_type      = "PERCENTAGE"
    notification_type   = "ACTUAL"

    subscriber_email_addresses = var.budget_alert_emails
  }
}

# Theo dõi chi phí theo từng AWS Service
resource "aws_budgets_budget" "cost_by_service" {
  name         = "cost-by-service"
  limit_amount = 0.5
  budget_type  = "COST"
  limit_unit   = "USD"
  time_unit    = "DAILY"
}

# Theo dõi chi phí theo từng AWS Service theo tháng
resource "aws_budgets_budget" "cost_by_service_monthly" {
  name         = "cost-by-service-monthly"
  limit_amount = 5
  budget_type  = "COST"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
}

# Theo dõi tổng số request (USAGE budget)
# Dùng để nắm được total request / total received ở mức usage daily.
# resource "aws_budgets_budget" "requests_usage" {
#   name         = "requests-usage"
#   budget_type  = "USAGE"
#   time_unit    = "DAILY"
#   limit_amount = 250
#   limit_unit   = "COUNT"
# }

# # Theo dõi tổng số request (USAGE budget) theo tháng
# resource "aws_budgets_budget" "requests_usage_monthly" {
#   name        = "requests-usage-monthly"
#   budget_type = "USAGE"
#   time_unit   = "MONTHLY"
# }

#Check for cost on which AWS Region used
resource "aws_budgets_budget" "cost_by_region" {
  name         = "cost-by-region"
  budget_type  = "COST"
  limit_unit   = "USD"
  limit_amount = 150
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }
}
