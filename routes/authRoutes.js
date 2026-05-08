const express = require('express');
const { body } = require('express-validator');
const { login, register } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateMiddleware');

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
    body('role').optional().isIn(['admin', 'customer']).withMessage('Role must be admin or customer'),
  ],
  validateRequest,
  register
);

module.exports = router;
