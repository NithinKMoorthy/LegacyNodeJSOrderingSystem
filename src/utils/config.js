// global application configuration, loaded from the environment
var config = {
  jwtSecret: process.env.JWT_SECRET || 'secret',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  exportBucket: process.env.EXPORT_BUCKET || 'legacy-orders-exports',
  notifyTopicArn: process.env.SNS_TOPIC_ARN || '',
  env: process.env.NODE_ENV || 'development'
};

module.exports = config;
