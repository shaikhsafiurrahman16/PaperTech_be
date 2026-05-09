const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { createSale, listSales, getSaleDetails, updateSale, deleteSale } = require('../controllers/saleController');

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin'), listSales);
router.get('/:id', authorize('admin', 'customer'), getSaleDetails);
router.post(
  '/',
  authorize('admin'),
  [
    body('customer_id')
      .optional({ nullable: true })
      .isInt().withMessage('Customer ID must be a valid number'),
    body('sale_type')
      .optional()
      .isIn(['cash', 'credit']).withMessage('Sale type must be cash or credit'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a number'),
    body('payment_received').optional().isFloat({ min: 0 }).withMessage('Payment must be a number'),
  ],
  validateRequest,
  createSale
);

router.put(
  '/:id',
  authorize('admin'),
  [
    body('sale_type')
      .optional()
      .isIn(['cash', 'credit']).withMessage('Sale type must be cash or credit'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a number'),
    body('payment_received').optional().isFloat({ min: 0 }).withMessage('Payment must be a number'),
  ],
  validateRequest,
  updateSale
);

router.delete('/:id', authorize('admin'), deleteSale);

module.exports = router;
