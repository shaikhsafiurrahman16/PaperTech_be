const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule } = require('../middleware/roleMiddleware');
const { getLedgerForVendor } = require('../controllers/vendorLedgerController');

const router = express.Router();

router.use(protect);
router.get('/:vendor_id', authorize('admin', 'company_user', 'vendor'), requireModule('vendors', 'view'), getLedgerForVendor);

module.exports = router;
