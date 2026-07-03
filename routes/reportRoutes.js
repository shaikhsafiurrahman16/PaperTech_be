const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireModule, requireAnyModule } = require('../middleware/roleMiddleware');
const {
  dashboardSummary,
  monthlySales,
  outstandingBalances,
  stockReport,
  profitReport,
} = require('../controllers/reportController');

const router = express.Router();
router.use(protect);

router.get('/dashboard', authorize('admin', 'company_user'), requireModule('dashboard', 'view'), dashboardSummary);
router.get('/monthly-sales', authorize('admin', 'company_user'), requireAnyModule(['dashboard', 'reports']), monthlySales);
router.get('/outstanding-balances', authorize('admin', 'company_user'), requireModule('reports', 'view'), outstandingBalances);
router.get('/stock', authorize('admin', 'company_user'), requireModule('reports', 'view'), stockReport);
router.get('/profit', authorize('admin', 'company_user'), requireModule('reports', 'view'), profitReport);

module.exports = router;
