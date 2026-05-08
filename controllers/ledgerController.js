const pool = require('../config/db');

async function getLedgerForCustomer(req, res, next) {
  try {
    const { customer_id } = req.params;
    const [customerRows] = await pool.query('SELECT id, full_name, shop_name, current_balance, username FROM customers WHERE id = ?', [customer_id]);
    if (!customerRows.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (req.user.role === 'customer' && req.user.username !== customerRows[0].username) {
      return res.status(403).json({ success: false, message: 'Forbidden: not your ledger' });
    }

    const [ledger] = await pool.query(
      `SELECT le.id, le.transaction_type, le.amount, le.previous_balance, le.current_balance, le.remarks, le.created_at,
              s.invoice_number, p.amount as payment_amount
       FROM ledger_entries le
       LEFT JOIN sales s ON s.id = le.sale_id
       LEFT JOIN payments p ON p.id = le.payment_id
       WHERE le.customer_id = ?
       ORDER BY le.created_at DESC`,
      [customer_id]
    );

    res.json({ success: true, data: { customer: customerRows[0], ledger } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getLedgerForCustomer };
