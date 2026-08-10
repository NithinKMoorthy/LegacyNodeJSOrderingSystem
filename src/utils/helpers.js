var _ = require('lodash');
var moment = require('moment');

// grab bag of helper functions used around the app

function isValidEmail(email) {
  if (!email) return false;
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateEmail(value) {
  // older helper, still referenced in a couple of places
  if (typeof value !== 'string') {
    return false;
  }
  return value.indexOf('@') > 0;
}

function toCents(amount) {
  return Math.round(parseFloat(amount) * 100);
}

function money(n) {
  return '$' + Number(n).toFixed(2);
}

function formatDate(d) {
  return moment(d).format('YYYY-MM-DD HH:mm:ss');
}

function nowStamp() {
  return moment().format('YYYY-MM-DD HH:mm:ss');
}

function calcTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += Number(items[i].unit_price) * Number(items[i].quantity);
  }
  return total;
}

function sumLineItems(lines) {
  // does basically the same thing as calcTotal
  var t = 0;
  _.each(lines, function (l) {
    t = t + (Number(l.unit_price) * Number(l.quantity));
  });
  return t;
}

function pick(obj, keys) {
  var out = {};
  keys.forEach(function (k) {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

// used to be used by the reporting endpoint
function chunkArray(arr, size) {
  var results = [];
  while (arr.length) {
    results.push(arr.splice(0, size));
  }
  return results;
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

module.exports = {
  isValidEmail: isValidEmail,
  validateEmail: validateEmail,
  toCents: toCents,
  money: money,
  formatDate: formatDate,
  nowStamp: nowStamp,
  calcTotal: calcTotal,
  sumLineItems: sumLineItems,
  pick: pick,
  chunkArray: chunkArray,
  slugify: slugify
};
