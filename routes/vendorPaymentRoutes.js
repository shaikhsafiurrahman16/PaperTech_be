const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { addVendorPayment, listVendorPayments } = require('../controllers/vendorPaymentController');

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), listVendorPayments);
router.post(
  '/',
  authorize('admin'),
  [
    body('vendor_id').isInt().withMessage('Vendor is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Payment amount must be greater than zero'),
    body('payment_method').optional().isIn(['cash', 'bank', 'cheque']).withMessage('Invalid payment method'),
    body('purchase_id').optional({ nullable: true }).isInt().withMessage('Purchase ID must be a valid number'),
  ],
  validateRequest,
  addVendorPayment
);

module.exports = router;
