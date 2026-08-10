var request = require('supertest');
var app = require('../src/app');

describe('orders api validation', function () {
  test('POST /orders without a user returns 400', function () {
    return request(app).post('/orders').send({ items: [] }).then(function (res) {
      expect(res.status).toBe(400);
    });
  });

  test('POST /orders/:id/items requires a product_id', function () {
    return request(app).post('/orders/1/items').send({ quantity: 2 }).then(function (res) {
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/product_id/);
    });
  });

  test('PUT /orders/:id/status requires auth', function () {
    return request(app).put('/orders/1/status').send({ status: 'paid' }).then(function (res) {
      expect(res.status).toBe(401);
    });
  });
});

describe('products api validation', function () {
  test('POST /products requires a name', function () {
    return request(app).post('/products').send({ price: 10 }).then(function (res) {
      expect(res.status).toBe(400);
    });
  });
});
