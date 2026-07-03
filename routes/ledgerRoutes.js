const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule } = require('../middleware/roleMiddleware');
const { getLedgerForCustomer } = require('../controllers/ledgerController');

const router = express.Router();
router.use(protect);
router.get('/:customer_id', authorize('admin', 'company_user', 'customer'), requireModule('customers', 'view'), getLedgerForCustomer);

module.exports = router;
