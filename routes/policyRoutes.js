const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
} = require('../controllers/policyController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('super_admin', 'admin'), listPolicies);
router.get('/:id', authorize('super_admin', 'admin'), getPolicy);
router.post(
  '/',
  authorize('super_admin', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Policy name is required'),
    body('description').optional({ nullable: true, checkFalsy: true }).trim(),
    body('allowed_modules').isArray({ min: 1 }).withMessage('At least one permission is required'),
  ],
  validateRequest,
  createPolicy,
);
router.put(
  '/:id',
  authorize('super_admin', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Policy name is required'),
    body('description').optional({ nullable: true, checkFalsy: true }).trim(),
    body('allowed_modules').isArray({ min: 1 }).withMessage('At least one permission is required'),
  ],
  validateRequest,
  updatePolicy,
);
router.delete('/:id', authorize('super_admin', 'admin'), deletePolicy);

module.exports = router;
