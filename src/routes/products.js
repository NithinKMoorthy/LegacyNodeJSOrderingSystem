var express = require('express');
var router = express.Router();
var productController = require('../controllers/productController');

router.get('/', productController.list);
router.get('/:id', productController.get);
router.post('/', productController.create);

module.exports = router;
