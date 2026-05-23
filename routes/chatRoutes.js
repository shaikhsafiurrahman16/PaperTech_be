const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { listContacts, listMessages, sendMessage, unreadSummary } = require('../controllers/chatController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'vendor', 'customer'));

router.get('/contacts', listContacts);
router.get('/unread-summary', unreadSummary);
router.get(
  '/:participantRole/:participantId/messages',
  [
    param('participantRole').isIn(['admin', 'vendor', 'customer']).withMessage('Invalid participant role'),
    param('participantId').isInt({ min: 1 }).withMessage('Invalid participant id'),
  ],
  validateRequest,
  listMessages
);
router.post(
  '/:participantRole/:participantId/messages',
  [
    param('participantRole').isIn(['admin', 'vendor', 'customer']).withMessage('Invalid participant role'),
    param('participantId').isInt({ min: 1 }).withMessage('Invalid participant id'),
    body('message').isString().trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message is too long'),
  ],
  validateRequest,
  sendMessage
);

module.exports = router;
