const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule } = require('../middleware/roleMiddleware');
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
router.get('/', authorize('admin', 'company_user'), requireModule('products', 'view'), listProducts);
router.get('/:id', authorize('admin', 'company_user', 'customer'), requireModule('products', 'view'), getProduct);
router.post(
  '/',
  authorize('admin', 'company_user'),
  requireModule('products', 'create'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('product_type').trim().notEmpty().withMessage('Product type is required'),
    body('size').optional({ nullable: true, checkFalsy: true }).trim(),
    body('gram').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('Gram is invalid'),
    body('unit_type').trim().notEmpty().withMessage('Unit type is required'),
    body('product_specs').optional().isObject().withMessage('Product specs must be an object'),
    body('cost_price').isFloat({ min: 0 }).withMessage('Cost price must be a valid number'),
    body('sale_price').isFloat({ min: 0 }).withMessage('Sale price must be a valid number'),
    body('current_stock').isInt({ min: 0 }).withMessage('Stock must be a valid integer'),
  ],
  validateRequest,
  addProduct
);
router.put(
  '/:id',
  authorize('admin', 'company_user'),
  requireModule('products', 'update'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('product_type').trim().notEmpty().withMessage('Product type is required'),
    body('size').optional({ nullable: true, checkFalsy: true }).trim(),
    body('gram').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('Gram is invalid'),
    body('unit_type').trim().notEmpty().withMessage('Unit type is required'),
    body('product_specs').optional().isObject().withMessage('Product specs must be an object'),
    body('cost_price').isFloat({ min: 0 }).withMessage('Cost price must be a valid number'),
    body('sale_price').isFloat({ min: 0 }).withMessage('Sale price must be a valid number'),
    body('current_stock').isInt({ min: 0 }).withMessage('Stock must be a valid integer'),
  ],
  validateRequest,
  updateProduct
);
router.patch('/:id/stock', authorize('admin', 'company_user'), requireModule('products', 'update'), updateStock);
router.delete('/:id', authorize('admin', 'company_user'), requireModule('products', 'delete'), deleteProduct);

module.exports = router;
