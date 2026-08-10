var db = require('../db/pool');
var bcrypt = require('bcryptjs');

function createUser(data) {
  var hash = data.password ? bcrypt.hashSync(data.password, 8) : null;
  var role = data.role || 'customer';
  return db.query(
    'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
    [data.email, data.name, hash, role]
  ).then(function (r) {
    return r.rows[0];
  });
}

function getUser(id) {
  return db.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [id])
    .then(function (r) {
      return r.rows[0];
    });
}

function getByEmail(email) {
  return db.query('SELECT * FROM users WHERE email = $1', [email]).then(function (r) {
    return r.rows[0];
  });
}

function listUsers() {
  return db.query('SELECT id, email, name, role, created_at FROM users ORDER BY id').then(function (r) {
    return r.rows;
  });
}

module.exports = {
  createUser: createUser,
  getUser: getUser,
  getByEmail: getByEmail,
  listUsers: listUsers
};
