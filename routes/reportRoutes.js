const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  dashboardSummary,
  monthlySales,
  outstandingBalances,
  stockReport,
  profitReport,
} = require('../controllers/reportController');

const router = express.Router();
router.use(protect);

router.get('/dashboard', authorize('admin'), dashboardSummary);
router.get('/monthly-sales', authorize('admin'), monthlySales);
router.get('/outstanding-balances', authorize('admin'), outstandingBalances);
router.get('/stock', authorize('admin'), stockReport);
router.get('/profit', authorize('admin'), profitReport);

module.exports = router;
