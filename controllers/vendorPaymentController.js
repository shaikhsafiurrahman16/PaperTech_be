const pool = require('../config/db');

async function findPaymentTarget(connection, vendorId, purchaseId) {
  if (purchaseId) {
    const [purchaseRows] = await connection.execute(
      'SELECT id, grand_total, payment_paid, remaining_balance FROM purchases WHERE id = ? AND vendor_id = ?',
      [purchaseId, vendorId]
    );
    if (!purchaseRows.length) {
      throw { statusCode: 404, message: 'Purchase not found' };
    }
    return purchaseRows[0];
  }

  const [purchaseRows] = await connection.execute(
    `SELECT id, grand_total, payment_paid, remaining_balance FROM purchases
     WHERE vendor_id = ? AND remaining_balance > 0
     ORDER BY created_at ASC
     LIMIT 1`,
    [vendorId]
  );
  return purchaseRows[0] || null;
}

async function applyPaymentToPurchase(connection, vendorId, amount, purchaseId) {
  const purchase = await findPaymentTarget(connection, vendorId, purchaseId);
  if (!purchase) {
    return { targetPurchaseId: null };
  }

  const remaining = Number(purchase.remaining_balance || 0);
  if (amount > remaining) {
    throw { statusCode: 400, message: 'Payment exceeds purchase remaining balance' };
  }

  const updatedPaid = Number(purchase.payment_paid || 0) + amount;
  const updatedRemaining = Math.max(0, Number(purchase.grand_total || 0) - updatedPaid);
  await connection.execute(
    'UPDATE purchases SET payment_paid = ?, remaining_balance = ?, updated_at = NOW() WHERE id = ?',
    [updatedPaid, updatedRemaining, purchase.id]
  );

  return { targetPurchaseId: purchase.id };
}

async function addVendorPayment(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { vendor_id, amount, payment_method, notes, purchase_id } = req.body;
    const paymentAmount = Number(amount || 0);
    if (paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    await connection.beginTransaction();
    const [vendorRows] = await connection.execute('SELECT current_balance FROM vendors WHERE id = ?', [vendor_id]);
    if (!vendorRows.length) {
      throw { statusCode: 404, message: 'Vendor not found' };
    }

    const previousBalance = Number(vendorRows[0].current_balance || 0);
    const newBalance = Math.max(0, previousBalance - paymentAmount);
    const { targetPurchaseId } = await applyPaymentToPurchase(connection, vendor_id, paymentAmount, purchase_id);

    const [paymentResult] = await connection.execute(
      `INSERT INTO vendor_payments (vendor_id, user_id, purchase_id, amount, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [vendor_id, req.user.id, targetPurchaseId || null, paymentAmount, payment_method || 'cash', notes || null]
    );

    await connection.execute('UPDATE vendors SET current_balance = ? WHERE id = ?', [newBalance, vendor_id]);
    await connection.execute(
      `INSERT INTO vendor_ledger_entries
       (vendor_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
       VALUES (?, ?, 'payment', ?, ?, ?, ?, NOW())`,
      [vendor_id, paymentResult.insertId, paymentAmount, previousBalance, newBalance, notes || 'Vendor payment paid']
    );

    await connection.commit();
    res.status(201).json({ success: true, data: { payment_id: paymentResult.insertId, vendor_id, amount: paymentAmount, new_balance: newBalance } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listVendorPayments(req, res, next) {
  try {
    const { vendor_id, from_date, to_date, search } = req.query;
    const params = [];
    let query =
      `SELECT vp.id, vp.vendor_id, v.company_name, v.full_name, vp.amount, vp.payment_method, vp.notes, vp.created_at,
              vp.purchase_id, p.purchase_number
       FROM vendor_payments vp
       LEFT JOIN vendors v ON v.id = vp.vendor_id
       LEFT JOIN purchases p ON p.id = vp.purchase_id
       WHERE 1=1`;

    if (vendor_id) {
      query += ' AND vp.vendor_id = ?';
      params.push(vendor_id);
    }

    if (search) {
      query += ' AND (v.company_name LIKE ? OR v.full_name LIKE ? OR v.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (from_date) {
      query += ' AND DATE(vp.created_at) >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND DATE(vp.created_at) <= ?';
      params.push(to_date);
    }

    query += ' ORDER BY vp.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = { addVendorPayment, listVendorPayments };
