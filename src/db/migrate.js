var fs = require('fs');
var path = require('path');
var db = require('./pool');

function run() {
  var sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('running migrations...');
  db.query(sql)
    .then(function () {
      console.log('migrations complete');
      return seed();
    })
    .then(function () {
      console.log('seed complete');
      process.exit(0);
    })
    .catch(function (err) {
      console.error('migration failed', err);
      process.exit(1);
    });
}

function seed() {
  // insert a couple of default rows if the tables are empty
  return db.query('SELECT count(*) FROM products').then(function (r) {
    if (parseInt(r.rows[0].count, 10) > 0) {
      return;
    }
    return db.query(
      "INSERT INTO products (sku, name, description, price, stock) VALUES " +
      "('SKU-001', 'Widget', 'A basic widget', 9.99, 100), " +
      "('SKU-002', 'Gadget', 'A fancy gadget', 19.99, 50), " +
      "('SKU-003', 'Gizmo', 'The premium gizmo', 49.99, 25)"
    );
  });
}

run();
