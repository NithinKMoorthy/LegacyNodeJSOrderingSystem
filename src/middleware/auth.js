var jwt = require('jsonwebtoken');
var config = require('../utils/config');

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret);
}

// attaches req.user if a token is present. does not reject requests
// without a token so that some public endpoints keep working.
function authenticate(req, res, next) {
  var header = req.headers['authorization'];
  if (!header) {
    return next();
  }
  var token = header.split(' ')[1] || header;
  try {
    var decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = decoded;
  } catch (e) {
    console.log('token verify failed: ' + e.message);
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

module.exports = {
  sign: sign,
  authenticate: authenticate,
  requireAuth: requireAuth
};
