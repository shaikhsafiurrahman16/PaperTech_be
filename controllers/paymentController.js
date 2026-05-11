const pool = require('../config/db');

async function addPayment(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { customer_id, amount, payment_method, notes, sale_id, invoice_id } = req.body;
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    await connection.beginTransaction();
    const [customerRows] = await connection.execute('SELECT current_balance FROM customers WHERE id = ?', [customer_id]);
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    let relatedSale = null;
    let relatedInvoice = null;
    let targetSaleId = sale_id;
    let targetInvoiceId = invoice_id;

    if (targetInvoiceId) {
      const [invoiceRows] = await connection.execute(
        'SELECT id, sale_id, grand_total, payment_received, remaining_balance FROM invoices WHERE id = ? AND customer_id = ?',
        [targetInvoiceId, customer_id]
      );
      if (!invoiceRows.length) {
        throw { statusCode: 404, message: 'Invoice not found' };
      }
      relatedInvoice = invoiceRows[0];
      targetSaleId = relatedInvoice.sale_id;
    }

    if (targetSaleId) {
      const [saleRows] = await connection.execute(
        'SELECT id, invoice_number, grand_total, payment_received, remaining_balance FROM sales WHERE id = ? AND customer_id = ?',
        [targetSaleId, customer_id]
      );
      if (!saleRows.length) {
        throw { statusCode: 404, message: 'Sale not found' };
      }
      relatedSale = saleRows[0];
      if (!relatedInvoice) {
        const [invoiceRows] = await connection.execute(
          'SELECT id, sale_id, grand_total, payment_received, remaining_balance FROM invoices WHERE sale_id = ? AND customer_id = ?',
          [targetSaleId, customer_id]
        );
        if (invoiceRows.length) {
          relatedInvoice = invoiceRows[0];
          targetInvoiceId = relatedInvoice.id;
        }
      }
    }

    const previousBalance = customerRows[0].current_balance;
    const newBalance = Math.max(0, previousBalance - amount);

    if (relatedInvoice) {
      const invoicePaid = Number(relatedInvoice.payment_received || 0);
      const invoiceRemaining = Number(relatedInvoice.remaining_balance || 0);
      if (amount > invoiceRemaining) {
        return res.status(400).json({ success: false, message: 'Payment exceeds invoice remaining balance' });
      }
      const updatedInvoicePaid = invoicePaid + amount;
      const updatedInvoiceRemaining = Math.max(0, Number(relatedInvoice.grand_total || 0) - updatedInvoicePaid);

      await connection.execute(
        'UPDATE invoices SET payment_received = ?, remaining_balance = ? WHERE id = ?',
        [updatedInvoicePaid, updatedInvoiceRemaining, relatedInvoice.id]
      );

      if (relatedSale) {
        await connection.execute(
          'UPDATE sales SET payment_received = ?, remaining_balance = ? WHERE id = ?',
          [updatedInvoicePaid, updatedInvoiceRemaining, relatedSale.id]
        );
      }
    } else if (relatedSale) {
      const salePaid = Number(relatedSale.payment_received || 0);
      const saleRemaining = Number(relatedSale.remaining_balance || 0);
      if (amount > saleRemaining) {
        return res.status(400).json({ success: false, message: 'Payment exceeds sale remaining balance' });
      }
      const updatedSalePaid = salePaid + amount;
      const updatedSaleRemaining = Math.max(0, Number(relatedSale.grand_total || 0) - updatedSalePaid);
      await connection.execute(
        'UPDATE sales SET payment_received = ?, remaining_balance = ? WHERE id = ?',
        [updatedSalePaid, updatedSaleRemaining, relatedSale.id]
      );
    }

    const [paymentResult] = await connection.execute(
      `INSERT INTO payments (customer_id, user_id, sale_id, amount, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [customer_id, req.user.id, targetSaleId || null, amount, payment_method || 'cash', notes || null]
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
