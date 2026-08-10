output "api_public_ip" {
  value = aws_instance.api.public_ip
}

output "db_endpoint" {
  value = aws_db_instance.orders.endpoint
}

output "exports_bucket" {
  value = aws_s3_bucket.exports.bucket
}

output "sns_topic_arn" {
  value = aws_sns_topic.order_events.arn
}
