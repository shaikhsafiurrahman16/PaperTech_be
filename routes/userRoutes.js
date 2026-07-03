const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  listAccessModules,
  listCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  deleteCompanyUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/modules', authorize('admin', 'company_user'), listAccessModules);

router.get('/', authorize('admin'), requireModule('users', 'view'), listCompanyUsers);
router.post(
  '/',
  authorize('admin'),
  requireModule('users', 'create'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email must be valid'),
    body('cnic').optional({ nullable: true, checkFalsy: true }).trim().matches(/^\d{1,13}$/).withMessage('CNIC must be digits only and maximum 13 digits'),
    body('address').optional({ nullable: true, checkFalsy: true }).trim(),
    body('username').trim().notEmpty().withMessage('Username is required').matches(/^\S+$/).withMessage('Username cannot contain spaces'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('policy_id').optional().isInt({ min: 1 }).withMessage('Invalid policy id'),
    body('allowed_modules').optional().isArray().withMessage('Policies must be a list'),
  ],
  validateRequest,
  createCompanyUser,
);
router.put(
  '/:id',
  authorize('admin'),
  requireModule('users', 'update'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email must be valid'),
    body('cnic').optional({ nullable: true, checkFalsy: true }).trim().matches(/^\d{1,13}$/).withMessage('CNIC must be digits only and maximum 13 digits'),
    body('address').optional({ nullable: true, checkFalsy: true }).trim(),
    body('username').trim().notEmpty().withMessage('Username is required').matches(/^\S+$/).withMessage('Username cannot contain spaces'),
    body('password').optional({ nullable: true, checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('policy_id').optional().isInt({ min: 1 }).withMessage('Invalid policy id'),
    body('allowed_modules').optional().isArray().withMessage('Policies must be a list'),
  ],
  validateRequest,
  updateCompanyUser,
);
router.delete('/:id', authorize('admin'), requireModule('users', 'delete'), deleteCompanyUser);

module.exports = router;
