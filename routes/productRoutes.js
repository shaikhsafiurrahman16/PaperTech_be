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
const paperTypes = ['carbon', 'Indonesia', 'Crown', 'Local', 'Bleach', 'art', 'Matt', 'Sticker', 'Everycard', 'News', 'Filecard'];
const sizes = ['23x36', '20x30', '25x36', '27x34', '18', '23', '17x27', '30', '40', '22', '28'];
const grams = [42, 52, 60, 68, 70, 75, 80, 90, 100, 150, 113, 128, 230, 250, 300, 350, 400];
const units = ['Card', 'Paper', 'sticker'];

router.use(protect);
router.get('/', authorize('admin'), listProducts);
router.get('/:id', authorize('admin', 'customer'), getProduct);
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('product_type').isIn(paperTypes).withMessage('Product type is invalid'),
    body('size').isIn(sizes).withMessage('Size is invalid'),
    body('gram').custom((value) => grams.includes(Number(value))).withMessage('Gram is invalid'),
    body('unit_type').isIn(units).withMessage('Unit type is invalid'),
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
    body('product_type').isIn(paperTypes).withMessage('Product type is invalid'),
    body('size').isIn(sizes).withMessage('Size is invalid'),
    body('gram').custom((value) => grams.includes(Number(value))).withMessage('Gram is invalid'),
    body('unit_type').isIn(units).withMessage('Unit type is invalid'),
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
