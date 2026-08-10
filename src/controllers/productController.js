var db = require('../db/pool');
var helpers = require('../utils/helpers');

// product endpoints talk to the database directly

function create(req, res) {
  var body = req.body || {};
  if (!body.name) {
    return res.status(400).json({ error: 'name is required' });
  }
  var price = body.price || 0;
  var stock = body.stock || 0;
  var sku = body.sku || helpers.slugify(body.name);
  db.query(
    'INSERT INTO products (sku, name, description, price, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [sku, body.name, body.description || null, price, stock]
  ).then(function (r) {
    res.status(201).json(r.rows[0]);
  }).catch(function (err) {
    res.status(500).json({ error: err.message, detail: err.detail });
  });
}

function get(req, res) {
  db.query('SELECT * FROM products WHERE id = $1', [req.params.id]).then(function (r) {
    if (!r.rows[0]) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(r.rows[0]);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

function list(req, res) {
  // supports an optional search filter
  var search = req.query.search;
  if (search) {
    var sql = "SELECT * FROM products WHERE name ILIKE '%" + search + "%' ORDER BY id";
    db.query(sql).then(function (r) {
      res.json(r.rows);
    }).catch(function (err) {
      res.status(500).json({ error: err.message });
    });
    return;
  }
  db.query('SELECT * FROM products ORDER BY id').then(function (r) {
    res.json(r.rows);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

module.exports = {
  create: create,
  get: get,
  list: list
};
