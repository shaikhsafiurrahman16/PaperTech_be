const pool = require('../config/db');

async function getLedgerForVendor(req, res, next) {
  try {
    const { vendor_id } = req.params;
    const [vendorRows] = await pool.query(
      'SELECT id, full_name, company_name, current_balance, username FROM vendors WHERE id = ?',
      [vendor_id]
    );
    if (!vendorRows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (req.user.role === 'vendor' && req.user.username !== vendorRows[0].username) {
      return res.status(403).json({ success: false, message: 'Forbidden: not your ledger' });
    }

    const [ledger] = await pool.query(
      `SELECT vle.id, vle.transaction_type, vle.amount, vle.previous_balance, vle.current_balance, vle.remarks, vle.created_at,
              p.purchase_number, vp.amount as payment_amount
       FROM vendor_ledger_entries vle
       LEFT JOIN purchases p ON p.id = vle.purchase_id
       LEFT JOIN vendor_payments vp ON vp.id = vle.payment_id
       WHERE vle.vendor_id = ?
       ORDER BY vle.created_at DESC`,
      [vendor_id]
    );

    res.json({ success: true, data: { vendor: vendorRows[0], ledger } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getLedgerForVendor };
