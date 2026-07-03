const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { addPayment, listPayments, updatePayment, deletePayment } = require('../controllers/paymentController');

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'company_user'), requireModule('payments', 'view'), listPayments);
router.post(
  '/',
  authorize('admin', 'company_user'),
  requireModule('payments', 'create'),
  [
    body('customer_id').isInt().withMessage('Customer is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Payment amount must be greater than zero'),
    body('sale_id').optional().isInt().withMessage('Sale ID must be a valid number'),
    body('invoice_id').optional().isInt().withMessage('Invoice ID must be a valid number'),
  ],
  validateRequest,
  addPayment
);
router.put(
  '/:id',
  authorize('admin', 'company_user'),
  requireModule('payments', 'update'),
  [
    body('customer_id').optional().isInt().withMessage('Customer is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Payment amount must be greater than zero'),
    body('sale_id').optional().isInt().withMessage('Sale ID must be a valid number'),
    body('invoice_id').optional().isInt().withMessage('Invoice ID must be a valid number'),
  ],
  validateRequest,
  updatePayment
);
router.delete('/:id', authorize('admin', 'company_user'), requireModule('payments', 'delete'), deletePayment);

module.exports = router;
