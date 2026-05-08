const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { addPayment, listPayments } = require('../controllers/paymentController');

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin'), listPayments);
router.post(
  '/',
  authorize('admin'),
  [
    body('customer_id').isInt().withMessage('Customer is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Payment amount must be greater than zero'),
  ],
  validateRequest,
  addPayment
);

module.exports = router;
