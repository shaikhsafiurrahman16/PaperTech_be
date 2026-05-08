const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  addProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} = require('../controllers/productController');

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), listProducts);
router.get('/:id', authorize('admin', 'customer'), getProduct);
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('product_type').trim().notEmpty().withMessage('Product type is required'),
    body('unit_type').trim().notEmpty().withMessage('Unit type is required'),
    body('cost_price').isFloat({ min: 0 }).withMessage('Cost price must be a valid number'),
    body('sale_price').isFloat({ min: 0 }).withMessage('Sale price must be a valid number'),
    body('current_stock').isInt({ min: 0 }).withMessage('Stock must be a valid integer'),
  ],
  validateRequest,
  addProduct
);
router.put(
  '/:id',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('product_type').trim().notEmpty().withMessage('Product type is required'),
    body('unit_type').trim().notEmpty().withMessage('Unit type is required'),
    body('cost_price').isFloat({ min: 0 }).withMessage('Cost price must be a valid number'),
    body('sale_price').isFloat({ min: 0 }).withMessage('Sale price must be a valid number'),
    body('current_stock').isInt({ min: 0 }).withMessage('Stock must be a valid integer'),
  ],
  validateRequest,
  updateProduct
);
router.patch('/:id/stock', authorize('admin'), updateStock);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
