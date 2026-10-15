var { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
var { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
var config = require('./config');

var s3Client = new S3Client({ region: config.awsRegion });
var snsClient = new SNSClient({ region: config.awsRegion });

// uploads a JSON export of an order to S3
function exportOrder(order, cb) {
  var key = 'orders/' + order.id + '.json';
  var params = {
    Bucket: config.exportBucket,
    Key: key,
    Body: JSON.stringify(order),
    ContentType: 'application/json'
  };
  var command = new PutObjectCommand(params);
  s3Client.send(command).then(function (data) {
    console.log('exported order ' + order.id + ' to s3://' + config.exportBucket + '/' + key);
    if (cb) cb(null, data);
  }).catch(function (err) {
    console.error('failed to export order to s3', err);
    if (cb) cb(err);
  });
}

// sends an order notification through SNS
function notifyOrder(order) {
  if (!config.notifyTopicArn) {
    return;
  }
  var params = {
    TopicArn: config.notifyTopicArn,
    Subject: 'Order ' + order.id + ' ' + order.status,
    Message: JSON.stringify({ orderId: order.id, status: order.status, total: order.total })
  };
  var command = new PublishCommand(params);
  snsClient.send(command).then(function () {
    console.log('published notification for order ' + order.id);
  }).catch(function (err) {
    console.error('failed to publish order notification', err);
  });
}

module.exports = {
  s3: s3Client,
  sns: snsClient,
  exportOrder: exportOrder,
  notifyOrder: notifyOrder
};
