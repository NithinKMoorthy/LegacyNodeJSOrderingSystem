var AWS = require('aws-sdk');
var config = require('./config');

AWS.config.update({ region: config.awsRegion });

var s3 = new AWS.S3();
var sns = new AWS.SNS();

// uploads a JSON export of an order to S3
function exportOrder(order, cb) {
  var key = 'orders/' + order.id + '.json';
  var params = {
    Bucket: config.exportBucket,
    Key: key,
    Body: JSON.stringify(order),
    ContentType: 'application/json'
  };
  s3.putObject(params, function (err, data) {
    if (err) {
      console.error('failed to export order to s3', err);
      if (cb) cb(err);
      return;
    }
    console.log('exported order ' + order.id + ' to s3://' + config.exportBucket + '/' + key);
    if (cb) cb(null, data);
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
  sns.publish(params, function (err) {
    if (err) {
      console.error('failed to publish order notification', err);
    } else {
      console.log('published notification for order ' + order.id);
    }
  });
}

module.exports = {
  s3: s3,
  sns: sns,
  exportOrder: exportOrder,
  notifyOrder: notifyOrder
};
