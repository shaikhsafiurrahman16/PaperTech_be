const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getLedgerForVendor } = require('../controllers/vendorLedgerController');

const router = express.Router();

router.use(protect);
router.get('/:vendor_id', authorize('admin', 'vendor'), getLedgerForVendor);

module.exports = router;
