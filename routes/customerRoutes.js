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
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\d{1,11}$/).withMessage('Phone number must be digits only and maximum 11 digits'),
    body('shop_name').trim().notEmpty().withMessage('Shop name is required'),
    body('cnic')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^\d{1,13}$/).withMessage('CNIC must be digits only and maximum 13 digits'),
    body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be a valid number'),
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .matches(/^\S+$/).withMessage('Username cannot contain spaces'),
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
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\d{1,11}$/).withMessage('Phone number must be digits only and maximum 11 digits'),
    body('shop_name').trim().notEmpty().withMessage('Shop name is required'),
    body('cnic')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^\d{1,13}$/).withMessage('CNIC must be digits only and maximum 13 digits'),
    body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be a valid number'),
  ],
  validateRequest,
  updateCustomer
);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;
