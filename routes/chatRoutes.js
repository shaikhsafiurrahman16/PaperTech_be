const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { listContacts, listMessages, sendMessage, unreadSummary } = require('../controllers/chatController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'company_user', 'vendor', 'customer'));

router.get('/contacts', requireModule('chat', 'view'), listContacts);
router.get('/unread-summary', requireModule('chat', 'view'), unreadSummary);
router.get(
  '/:participantRole/:participantId/messages',
  requireModule('chat', 'view'),
  [
    param('participantRole').isIn(['admin', 'vendor', 'customer']).withMessage('Invalid participant role'),
    param('participantId').isInt({ min: 1 }).withMessage('Invalid participant id'),
  ],
  validateRequest,
  listMessages
);
router.post(
  '/:participantRole/:participantId/messages',
  requireModule('chat', 'create'),
  [
    param('participantRole').isIn(['admin', 'vendor', 'customer']).withMessage('Invalid participant role'),
    param('participantId').isInt({ min: 1 }).withMessage('Invalid participant id'),
    body('message').isString().trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message is too long'),
  ],
  validateRequest,
  sendMessage
);

module.exports = router;
