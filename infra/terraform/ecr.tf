#######################################
## ECR – Repository cho backend image
#######################################

resource "aws_ecr_repository" "backend" {
  name = "${var.project_name}-backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${var.project_name}-backend-ecr"
    }
  )
}


