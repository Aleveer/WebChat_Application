terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Cấu hình backend lưu state (S3 + DynamoDB)
  # backend "s3" {
  #   bucket = "your-tf-state-bucket"
  #   key    = "webchat-app/terraform.tfstate"
  #   region = "ap-southeast-1"
  # }
}

provider "aws" {
  region = var.aws_region
}


