var userService = require('../services/userService');
var helpers = require('../utils/helpers');
var bcrypt = require('bcryptjs');
var auth = require('../middleware/auth');

function create(req, res) {
  var body = req.body || {};
  if (!body.email || !helpers.isValidEmail(body.email)) {
    return res.status(400).json({ error: 'valid email is required' });
  }
  if (!body.name) {
    return res.status(400).json({ error: 'name is required' });
  }
  userService.createUser(body).then(function (user) {
    res.status(201).json(user);
  }).catch(function (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'email already exists' });
    }
    res.status(500).json({ error: err.message, detail: err.detail });
  });
}

function get(req, res) {
  userService.getUser(req.params.id).then(function (user) {
    if (!user) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(user);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

function list(req, res) {
  userService.listUsers().then(function (users) {
    res.json(users);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

function login(req, res) {
  var body = req.body || {};
  if (!body.email) {
    return res.status(400).json({ error: 'email is required' });
  }
  userService.getByEmail(body.email).then(function (user) {
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    var ok = user.password_hash && bcrypt.compareSync(body.password || '', user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    var token = auth.sign(user);
    res.json({ token: token, user: { id: user.id, email: user.email, role: user.role } });
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
}

module.exports = {
  create: create,
  get: get,
  list: list,
  login: login
};
