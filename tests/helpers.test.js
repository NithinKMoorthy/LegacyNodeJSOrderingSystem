var helpers = require('../src/utils/helpers');

describe('helpers', function () {
  test('isValidEmail accepts a good email', function () {
    expect(helpers.isValidEmail('a@b.com')).toBe(true);
  });

  test('isValidEmail rejects a bad email', function () {
    expect(helpers.isValidEmail('not-an-email')).toBe(false);
    expect(helpers.isValidEmail('')).toBe(false);
  });

  test('calcTotal sums line items', function () {
    var items = [
      { unit_price: 10, quantity: 2 },
      { unit_price: 5, quantity: 1 }
    ];
    expect(helpers.calcTotal(items)).toBe(25);
  });

  test('money formats a number', function () {
    expect(helpers.money(9.5)).toBe('$9.50');
  });
});
