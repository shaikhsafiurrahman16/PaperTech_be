const express = require('express');
const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const productRoutes = require('./productRoutes');
const saleRoutes = require('./saleRoutes');
const paymentRoutes = require('./paymentRoutes');
const reportRoutes = require('./reportRoutes');
const ledgerRoutes = require('./ledgerRoutes');
const purchaseRoutes = require('./purchaseRoutes');
const vendorRoutes = require('./vendorRoutes');
const vendorPaymentRoutes = require('./vendorPaymentRoutes');
const vendorLedgerRoutes = require('./vendorLedgerRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vendor-payments', vendorPaymentRoutes);
router.use('/vendor-ledger', vendorLedgerRoutes);

module.exports = router;
