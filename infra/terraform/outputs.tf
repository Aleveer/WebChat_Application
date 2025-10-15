output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_id" { value = aws_subnet.public.id }
output "ec2_public_ip" { value = aws_instance.backend_host.public_ip }
output "s3_bucket_name" { value = aws_s3_bucket.frontend.bucket }
output "dynamodb_table" { value = aws_dynamodb_table.sessions.name }
