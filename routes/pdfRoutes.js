const express = require('express');
const pdfController = require('../controllers/pdfController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// HTML rendering (for preview)
router.get('/invoice/:type/:id', pdfController.renderInvoiceHtml);

// PDF download
router.get('/invoice/:type/:id/download', protect, pdfController.downloadInvoicePdf);

module.exports = router;
