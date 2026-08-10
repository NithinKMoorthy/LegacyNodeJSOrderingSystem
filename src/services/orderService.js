var db = require('../db/pool');
var helpers = require('../utils/helpers');
var awsUtil = require('../utils/aws');

// creates an order and its initial line items (if any)
function createOrder(userId, notes, items) {
  var orderId;
  return db.query(
    'INSERT INTO orders (user_id, status, notes) VALUES ($1, $2, $3) RETURNING id',
    [userId, 'pending', notes || null]
  ).then(function (r) {
    orderId = r.rows[0].id;
    if (!items || !items.length) {
      return;
    }
    var chain = Promise.resolve();
    items.forEach(function (it) {
      chain = chain.then(function () {
        return db.query('SELECT price FROM products WHERE id = $1', [it.product_id]).then(function (pr) {
          var price = pr.rows[0] ? pr.rows[0].price : 0;
          return db.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
            [orderId, it.product_id, it.quantity || 1, price]
          );
        });
      });
    });
    return chain;
  }).then(function () {
    return recalcTotal(orderId);
  }).then(function () {
    return getOrder(orderId);
  }).then(function (order) {
    awsUtil.notifyOrder(order);
    return order;
  });
}

function recalcTotal(orderId) {
  return db.query('SELECT quantity, unit_price FROM order_items WHERE order_id = $1', [orderId])
    .then(function (r) {
      var total = helpers.calcTotal(r.rows);
      return db.query('UPDATE orders SET total = $1, updated_at = now() WHERE id = $2', [total, orderId]);
    });
}

function getOrder(id) {
  var order;
  return db.query('SELECT * FROM orders WHERE id = $1', [id]).then(function (r) {
    order = r.rows[0];
    if (!order) return null;
    return db.query('SELECT * FROM order_items WHERE order_id = $1', [id]).then(function (ir) {
      order.items = ir.rows;
      return order;
    });
  });
}

function listOrdersForUser(userId) {
  return db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    .then(function (r) {
      return r.rows;
    });
}

module.exports = {
  createOrder: createOrder,
  recalcTotal: recalcTotal,
  getOrder: getOrder,
  listOrdersForUser: listOrdersForUser
};
