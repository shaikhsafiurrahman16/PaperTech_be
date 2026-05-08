const pool = require('../config/db');
const { updateProductStock } = require('../utils/inventoryService');

async function createSale(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { customer_id, items, discount = 0, payment_received = 0 } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one sale item is required' });
    }

    await connection.beginTransaction();
    const [customerRows] = await connection.execute('SELECT id, current_balance FROM customers WHERE id = ?', [customer_id]);
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    const invoiceNumber = `INV-${Date.now()}`;
    let totalAmount = 0;

    for (const item of items) {
      totalAmount += item.quantity * item.unit_price;
    }

    const grandTotal = Math.max(0, totalAmount - discount);
    const paymentReceived = Math.max(0, Math.min(payment_received, grandTotal));
    const remainingBalance = Math.max(0, grandTotal - paymentReceived);
    const saleType = remainingBalance > 0 ? 'credit' : 'cash';

    const [saleResult] = await connection.execute(
      `INSERT INTO sales (invoice_number, customer_id, user_id, total_amount, discount, grand_total, payment_received, remaining_balance, sale_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [invoiceNumber, customer_id, req.user.id, totalAmount, discount, grandTotal, paymentReceived, remainingBalance, saleType]
    );

    const saleId = saleResult.insertId;

    for (const item of items) {
      await connection.execute(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [saleId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );

      await updateProductStock(connection, item.product_id, item.quantity, 'sale', saleId, `Sale ${invoiceNumber}`);
    }

    const previousBalance = customerRows[0].current_balance;
    let currentBalance = previousBalance;

    if (remainingBalance > 0) {
      currentBalance += remainingBalance;
      await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [currentBalance, customer_id]);
      await connection.execute(
        `INSERT INTO ledger_entries (customer_id, sale_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, NOW())`,
        [customer_id, saleId, 'sale', grandTotal, previousBalance, currentBalance, `Sale ${invoiceNumber}`]
      );
    }

    if (paymentReceived > 0) {
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments (customer_id, user_id, sale_id, amount, payment_method, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [customer_id, req.user.id, saleId, paymentReceived, 'cash', 'Sale payment']
      );

      const paymentId = paymentResult.insertId;
      const prevBalance = currentBalance;
      currentBalance = Math.max(0, currentBalance - paymentReceived);
      await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [currentBalance, customer_id]);
      await connection.execute(
        `INSERT INTO ledger_entries (customer_id, sale_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [customer_id, saleId, paymentId, 'payment', paymentReceived, prevBalance, currentBalance, `Payment for ${invoiceNumber}`]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, data: { sale_id: saleId, invoice_number: invoiceNumber, total_amount: totalAmount, grand_total: grandTotal, remaining_balance: Math.max(0, remainingBalance), current_balance: currentBalance } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listSales(req, res, next) {
  try {
    let query = `SELECT s.id, s.invoice_number, c.shop_name, c.full_name, s.total_amount, s.discount, s.grand_total, s.payment_received, s.remaining_balance, s.sale_type, s.created_at, s.customer_id
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id`;
    
    // اگر customer ہے تو صرف اپنی sales دکھائیں
    if (req.user && req.user.role === 'customer') {
      query += ` WHERE s.customer_id = ?`;
    }
    
    query += ` ORDER BY s.created_at DESC`;

    let rows;
    if (req.user && req.user.role === 'customer') {
      [rows] = await pool.query(query, [req.user.id]);
    } else {
      [rows] = await pool.query(query);
    }
    
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getSaleDetails(req, res, next) {
  try {
    const { id } = req.params;
    const [saleRows] = await pool.query(
      `SELECT s.*, c.full_name, c.shop_name, c.phone
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.id = ?`,
      [id]
    );
    if (!saleRows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const [items] = await pool.query(
      `SELECT si.*, p.name as product_name
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [id]
    );

    res.json({ success: true, data: { sale: saleRows[0], items } });
  } catch (error) {
    next(error);
  }
}

module.exports = { createSale, listSales, getSaleDetails };
