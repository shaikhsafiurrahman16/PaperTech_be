const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { createPurchase, listPurchases, getPurchaseDetails, updatePurchase } = require('../controllers/purchaseController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'vendor'), listPurchases);
router.get('/:id', authorize('admin', 'vendor'), getPurchaseDetails);
router.post(
  '/',
  authorize('admin'),
  [
    body('vendor_id').isInt().withMessage('Vendor is required'),
    body('purchase_type').optional().isIn(['cash', 'credit']).withMessage('Purchase type must be cash or credit'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a valid number'),
    body('payment_paid').optional().isFloat({ min: 0 }).withMessage('Payment paid must be a valid number'),
    body('items').isArray({ min: 1 }).withMessage('At least one purchase item is required'),
  ],
  validateRequest,
  createPurchase
);
router.put(
  '/:id',
  authorize('admin'),
  [
    body('purchase_type').optional().isIn(['cash', 'credit']).withMessage('Purchase type must be cash or credit'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a valid number'),
    body('payment_paid').optional().isFloat({ min: 0 }).withMessage('Payment paid must be a valid number'),
  ],
  validateRequest,
  updatePurchase
);

module.exports = router;
