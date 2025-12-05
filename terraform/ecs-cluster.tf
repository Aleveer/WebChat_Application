resource "aws_ecs_cluster" "backend" {
  name = "${var.project_name}-ecs-cluster"

  tags = var.default_tags
}
