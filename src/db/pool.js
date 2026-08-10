var Pool = require('pg').Pool;

// shared database pool used across the app
var pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'orders',
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', function (err) {
  console.error('unexpected pg pool error', err);
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool: pool,
  query: query
};
