const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), listCustomers);
router.get('/:id', authorize('admin', 'customer'), getCustomer);
router.post(
  '/',
  authorize('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('shop_name').trim().notEmpty().withMessage('Shop name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  createCustomer
);
router.put(
  '/:id',
  authorize('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('shop_name').trim().notEmpty().withMessage('Shop name is required'),
  ],
  validateRequest,
  updateCustomer
);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;
