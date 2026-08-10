provider "aws" {
  region = var.region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnet_ids" "default" {
  vpc_id = data.aws_vpc.default.id
}

resource "aws_security_group" "api" {
  name        = "legacy-orders-api"
  description = "legacy orders api"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db" {
  name        = "legacy-orders-db"
  description = "legacy orders db"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "orders" {
  identifier          = "legacy-orders-db"
  engine              = "postgres"
  engine_version      = "12.7"
  instance_class      = "db.t2.micro"
  allocated_storage   = 20
  name                = "orders"
  username            = var.db_username
  password            = var.db_password
  publicly_accessible = true
  skip_final_snapshot = true
  vpc_security_group_ids = [aws_security_group.db.id]
}

resource "aws_s3_bucket" "exports" {
  bucket = "legacy-orders-exports-${var.region}"
  acl    = "private"
}

resource "aws_sns_topic" "order_events" {
  name = "legacy-orders-events"
}

resource "aws_iam_role" "api" {
  name = "legacy-orders-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy" "api" {
  name = "legacy-orders-api-policy"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:*", "sns:*"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_instance" "api" {
  ami                    = var.ami
  instance_type          = "t2.micro"
  subnet_id              = tolist(data.aws_subnet_ids.default.ids)[0]
  vpc_security_group_ids = [aws_security_group.api.id]

  tags = {
    Name = "legacy-orders-api"
  }
}
