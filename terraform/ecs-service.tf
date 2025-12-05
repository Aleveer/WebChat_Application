resource "aws_security_group" "ecs_service_sg" {
  name        = "${var.project_name}-ecs-sg"
  description = "ECS service security group"
  vpc_id      = var.vpc_id

  # Chỉ cho phép ALB gọi vào port 3000
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.default_tags
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 14

  tags = var.default_tags
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"

  # Có thể tạo riêng 1 role ECS task; tạm tái sử dụng role Lambda để đơn giản
  execution_role_arn = aws_iam_role.lambda_exec.arn
  task_role_arn      = aws_iam_role.lambda_exec.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.node_env
        },
        {
          name  = "MONGODB_URI"
          value = var.mongodb_uri
        },
        {
          name  = "UPLOADS_BUCKET_NAME"
          value = var.uploads_bucket_name
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        },
        {
          name  = "JWT_EXPIRES_IN"
          value = var.jwt_expires_in
        },
        {
          name  = "JWT_REFRESH_EXPIRES_IN"
          value = var.jwt_refresh_expires_in
        },
        {
          name  = "EMAIL_HOST"
          value = var.email_host
        },
        {
          name  = "EMAIL_PORT"
          value = tostring(var.email_port)
        },
        {
          name  = "EMAIL_SECURE"
          value = tostring(var.email_secure)
        },
        {
          name  = "EMAIL_USER"
          value = var.email_user
        },
        {
          name  = "EMAIL_PASS"
          value = var.email_pass
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])

  tags = var.default_tags
}

resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-ecs-service"
  cluster         = aws_ecs_cluster.backend.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.ecs_service_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend_tg.arn
    container_name   = "backend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]

  tags = var.default_tags
}
