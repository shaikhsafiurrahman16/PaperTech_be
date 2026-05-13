const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  createVendor,
  listVendors,
  getVendor,
  updateVendor,
  deleteVendor,
} = require('../controllers/vendorController');

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin'), listVendors);
router.get('/:id', authorize('admin', 'vendor'), getVendor);
router.post(
  '/',
  authorize('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\d{1,11}$/).withMessage('Phone number must be digits only and maximum 11 digits'),
    body('company_name').trim().notEmpty().withMessage('Company name is required'),
    body('cnic')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^\d{1,13}$/).withMessage('CNIC must be digits only and maximum 13 digits'),
    body('opening_balance').optional().isFloat({ min: 0 }).withMessage('Opening balance must be a valid number'),
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .matches(/^\S+$/).withMessage('Username cannot contain spaces'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  createVendor
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
    body('company_name').trim().notEmpty().withMessage('Company name is required'),
    body('cnic')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^\d{1,13}$/).withMessage('CNIC must be digits only and maximum 13 digits'),
  ],
  validateRequest,
  updateVendor
);
router.delete('/:id', authorize('admin'), deleteVendor);

module.exports = router;
