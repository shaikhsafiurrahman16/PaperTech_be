const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { createSale, listSales, getSaleDetails } = require('../controllers/saleController');

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin'), listSales);
router.get('/:id', authorize('admin', 'customer'), getSaleDetails);
router.post(
  '/',
  authorize('admin'),
  [
    body('customer_id').isInt().withMessage('Customer is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a number'),
    body('payment_received').optional().isFloat({ min: 0 }).withMessage('Payment must be a number'),
  ],
  validateRequest,
  createSale
);

module.exports = router;
