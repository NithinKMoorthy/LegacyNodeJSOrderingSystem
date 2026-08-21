var express = require('express');
var cors = require('cors');
var morgan = require('morgan');

var auth = require('./middleware/auth');
var errorHandler = require('./middleware/errorHandler');

var users = require('./routes/users');
var products = require('./routes/products');
var orders = require('./routes/orders');

var app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auth.authenticate);

app.get('/health', function (req, res) {
  res.json({ status: 'ok' });
});

app.use('/users', users);
app.use('/products', products);
app.use('/orders', orders);

app.use(errorHandler);

module.exports = app;
