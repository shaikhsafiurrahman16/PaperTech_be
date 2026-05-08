const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getLedgerForCustomer } = require('../controllers/ledgerController');

const router = express.Router();
router.use(protect);
router.get('/:customer_id', authorize('admin', 'customer'), getLedgerForCustomer);

module.exports = router;
