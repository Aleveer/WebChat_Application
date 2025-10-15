variable "project_name" {
  type        = string
  description = "Tên dự án để prefix tài nguyên"
  default     = "webchat"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "ssh_ingress_cidr" {
  type        = string
  description = "CIDR cho SSH (nên giới hạn IP cá nhân)"
  default     = "0.0.0.0/0"
}
