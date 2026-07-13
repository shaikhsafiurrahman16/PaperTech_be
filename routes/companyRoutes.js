const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { createCompany, listCompanies, getCompany, updateCompany, deleteCompany } = require('../controllers/companyController');

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.get('/', listCompanies);
router.get('/:id', getCompany);
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('code').trim().notEmpty().withMessage('Company code is required'),
    body('field_type').optional().isIn(['paper', 'autos', 'karyana', 'computers']).withMessage('Invalid field type'),
    body('admin_full_name').optional().trim().notEmpty().withMessage('Admin full name is required'),
    body('admin_username').trim().notEmpty().withMessage('Admin username is required'),
    body('admin_password').isLength({ min: 6 }).withMessage('Admin password must be at least 6 characters'),
    body('policy_id').optional().isInt({ min: 1 }).withMessage('Invalid policy id'),
    body('admin_allowed_modules').optional().isArray().withMessage('Admin policies must be a list'),
  ],
  validateRequest,
  createCompany
);
router.put(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('code').trim().notEmpty().withMessage('Company code is required'),
    body('field_type').optional().isIn(['paper', 'autos', 'karyana', 'computers']).withMessage('Invalid field type'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
    body('admin_full_name').optional({ nullable: true, checkFalsy: true }).trim().notEmpty().withMessage('Admin name is required'),
    body('admin_username').optional({ nullable: true, checkFalsy: true }).trim().notEmpty().withMessage('Admin username is required'),
    body('admin_password').optional({ nullable: true, checkFalsy: true }).isLength({ min: 6 }).withMessage('Admin password must be at least 6 characters'),
    body('policy_id').optional().isInt({ min: 1 }).withMessage('Invalid policy id'),
    body('admin_allowed_modules').optional().isArray().withMessage('Admin policies must be a list'),
  ],
  validateRequest,
  updateCompany
);
router.delete('/:id', deleteCompany);

module.exports = router;
