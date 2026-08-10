var express = require('express');
var router = express.Router();
var orderController = require('../controllers/orderController');
var auth = require('../middleware/auth');

router.post('/', orderController.create);
router.get('/:id', orderController.get);
router.post('/:id/items', orderController.addItem);
router.put('/:id/status', auth.requireAuth, orderController.updateStatus);
router.post('/:id/cancel', orderController.cancel);
router.post('/:id/export', auth.requireAuth, orderController.exportToS3);

// list orders for a given user
router.get('/user/:userId', orderController.listForUser);

module.exports = router;
