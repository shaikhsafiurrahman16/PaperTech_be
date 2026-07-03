const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { createPurchase, listPurchases, getPurchaseDetails, updatePurchase } = require('../controllers/purchaseController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'company_user', 'vendor'), requireModule('purchases', 'view'), listPurchases);
router.get('/:id', authorize('admin', 'company_user', 'vendor'), requireModule('purchases', 'view'), getPurchaseDetails);
router.post(
  '/',
  authorize('admin', 'company_user'),
  requireModule('purchases', 'create'),
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
  authorize('admin', 'company_user'),
  requireModule('purchases', 'update'),
  [
    body('purchase_type').optional().isIn(['cash', 'credit']).withMessage('Purchase type must be cash or credit'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a valid number'),
    body('payment_paid').optional().isFloat({ min: 0 }).withMessage('Payment paid must be a valid number'),
  ],
  validateRequest,
  updatePurchase
);

module.exports = router;
