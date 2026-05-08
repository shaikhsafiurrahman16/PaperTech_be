const pool = require('../config/db');

async function addPayment(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { customer_id, amount, payment_method, notes } = req.body;
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    await connection.beginTransaction();
    const [customerRows] = await connection.execute('SELECT current_balance FROM customers WHERE id = ?', [customer_id]);
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    const previousBalance = customerRows[0].current_balance;
    const newBalance = Math.max(0, previousBalance - amount);

    const [paymentResult] = await connection.execute(
      `INSERT INTO payments (customer_id, user_id, amount, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [customer_id, req.user.id, amount, payment_method || 'cash', notes || null]
    );

    await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [newBalance, customer_id]);
    await connection.execute(
      `INSERT INTO ledger_entries (customer_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [customer_id, paymentResult.insertId, 'payment', amount, previousBalance, newBalance, notes || 'Payment collected']
    );

    await connection.commit();
    res.status(201).json({ success: true, data: { payment_id: paymentResult.insertId, customer_id, amount, new_balance: newBalance } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listPayments(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.customer_id, c.shop_name, c.full_name, p.amount, p.payment_method, p.notes, p.created_at
       FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = { addPayment, listPayments };
