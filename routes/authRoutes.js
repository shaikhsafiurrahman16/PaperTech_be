const express = require('express');
const { body } = require('express-validator');
const { login, register, changePassword } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['super_admin', 'admin']).withMessage('Role must be super_admin or admin'),
    body('company_id').optional({ nullable: true }).isInt().withMessage('company_id must be valid'),
  ],
  validateRequest,
  register
);

router.post(
  '/change-password',
  protect,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').notEmpty().withMessage('New password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirm_password').notEmpty().withMessage('Please confirm the new password'),
    body('confirm_password')
      .custom((value, { req }) => value === req.body.new_password)
      .withMessage('Password confirmation does not match'),
  ],
  validateRequest,
  changePassword
);

module.exports = router;
