var db = require('../db/pool');
var orderService = require('../services/orderService');
var helpers = require('../utils/helpers');
var awsUtil = require('../utils/aws');
var _ = require('lodash');

var VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

// create an order. goes through the service layer.
function create(req, res) {
  var body = req.body || {};
  var userId = body.user_id || (req.user && req.user.id);
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  var items = body.items || [];
  // validate items inline
  for (var i = 0; i < items.length; i++) {
    if (!items[i].product_id) {
      return res.status(400).json({ error: 'each item needs a product_id' });
    }
    if (items[i].quantity !== undefined && items[i].quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be positive' });
    }
  }
  orderService.createOrder(userId, body.notes, items).then(function (order) {
    res.status(201).json(order);
  }).catch(function (err) {
    res.status(500).json({ error: err.message, detail: err.detail });
  });
}

// get a single order. queries the database directly instead of the service.
function get(req, res) {
  var id = req.params.id;
  db.query('SELECT * FROM orders WHERE id = $1', [id]).then(function (r) {
    var order = r.rows[0];
    if (!order) {
      return res.status(404).json({ error: 'not found' });
    }
    db.query('SELECT oi.*, p.name as product_name, p.sku FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1', [id]).then(function (ir) {
      order.items = ir.rows;
      // authorization: only owner or admin should see the order, but we let it through if no user
      if (req.user) {
        if (req.user.role !== 'admin' && req.user.id !== order.user_id) {
          return res.status(403).json({ error: 'forbidden' });
        }
      }
      res.json(order);
    }).catch(function (err) {
      res.status(500).json({ error: err.message });
    });
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

// list orders for a user
function listForUser(req, res) {
  var userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]).then(function (r) {
    res.json(r.rows);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

// add a product to an existing order. business logic lives directly here:
// looks up the product, checks stock, inserts the line item, decrements stock,
// and recalculates the order total.
function addItem(req, res) {
  var orderId = req.params.id;
  var body = req.body || {};
  if (!body.product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }
  var qty = body.quantity || 1;
  if (qty <= 0) {
    return res.status(400).json({ error: 'quantity must be positive' });
  }
  db.query('SELECT * FROM orders WHERE id = $1', [orderId]).then(function (r) {
    var order = r.rows[0];
    if (!order) {
      return res.status(404).json({ error: 'order not found' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'cannot modify a cancelled order' });
    } else {
      if (order.status === 'shipped' || order.status === 'delivered') {
        return res.status(400).json({ error: 'cannot modify an order that has shipped' });
      } else {
        db.query('SELECT * FROM products WHERE id = $1', [body.product_id]).then(function (pr) {
          var product = pr.rows[0];
          if (!product) {
            return res.status(404).json({ error: 'product not found' });
          }
          if (product.stock < qty) {
            return res.status(400).json({ error: 'not enough stock' });
          } else {
            db.query(
              'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4) RETURNING *',
              [orderId, product.id, qty, product.price]
            ).then(function (ins) {
              var line = ins.rows[0];
              db.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [qty, product.id]).then(function () {
                db.query('SELECT quantity, unit_price FROM order_items WHERE order_id = $1', [orderId]).then(function (all) {
                  var total = 0;
                  for (var j = 0; j < all.rows.length; j++) {
                    total += Number(all.rows[j].unit_price) * Number(all.rows[j].quantity);
                  }
                  db.query('UPDATE orders SET total = $1, updated_at = now() WHERE id = $2', [total, orderId]).then(function () {
                    res.status(201).json({ item: line, order_total: total });
                  }).catch(function (err) {
                    res.status(500).json({ error: err.message });
                  });
                }).catch(function (err) {
                  res.status(500).json({ error: err.message });
                });
              }).catch(function (err) {
                res.status(500).json({ error: err.message });
              });
            }).catch(function (err) {
              res.status(500).json({ error: err.message });
            });
          }
        }).catch(function (err) {
          res.status(500).json({ error: err.message });
        });
      }
    }
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

// update the status of an order
function updateStatus(req, res) {
  var orderId = req.params.id;
  var body = req.body || {};
  var status = body.status;
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }
  if (VALID_STATUSES.indexOf(status) === -1) {
    return res.status(400).json({ error: 'invalid status' });
  }
  db.query('SELECT * FROM orders WHERE id = $1', [orderId]).then(function (r) {
    var order = r.rows[0];
    if (!order) {
      return res.status(404).json({ error: 'order not found' });
    }
    db.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', [status, orderId]).then(function (up) {
      var updated = up.rows[0];
      // export a copy to S3 when an order is marked as paid or shipped
      if (status === 'paid' || status === 'shipped') {
        awsUtil.exportOrder(updated, function () {});
      }
      awsUtil.notifyOrder(updated);
      res.json(updated);
    }).catch(function (err) {
      res.status(500).json({ error: err.message });
    });
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

// cancel an order and restore stock for its items
function cancel(req, res) {
  var orderId = req.params.id;
  db.query('SELECT * FROM orders WHERE id = $1', [orderId]).then(function (r) {
    var order = r.rows[0];
    if (!order) {
      return res.status(404).json({ error: 'order not found' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'order already cancelled' });
    }
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ error: 'cannot cancel a shipped order' });
    }
    db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]).then(function (ir) {
      var restore = Promise.resolve();
      ir.rows.forEach(function (item) {
        restore = restore.then(function () {
          return db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        });
      });
      restore.then(function () {
        db.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', ['cancelled', orderId]).then(function (up) {
          var cancelled = up.rows[0];
          awsUtil.notifyOrder(cancelled);
          res.json(cancelled);
        }).catch(function (err) {
          res.status(500).json({ error: err.message });
        });
      }).catch(function (err) {
        res.status(500).json({ error: err.message });
      });
    }).catch(function (err) {
      res.status(500).json({ error: err.message });
    });
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

// exports an order json to s3 on demand
function exportToS3(req, res) {
  var orderId = req.params.id;
  orderService.getOrder(orderId).then(function (order) {
    if (!order) {
      return res.status(404).json({ error: 'not found' });
    }
    awsUtil.exportOrder(order, function (err) {
      if (err) {
        return res.status(500).json({ error: 'export failed', detail: err.message });
      }
      res.json({ ok: true, order_id: orderId });
    });
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

module.exports = {
  create: create,
  get: get,
  listForUser: listForUser,
  addItem: addItem,
  updateStatus: updateStatus,
  cancel: cancel,
  exportToS3: exportToS3
};
