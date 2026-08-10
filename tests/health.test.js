var request = require('supertest');
var app = require('../src/app');

describe('health endpoint', function () {
  test('GET /health returns ok', function () {
    return request(app).get('/health').then(function (res) {
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
