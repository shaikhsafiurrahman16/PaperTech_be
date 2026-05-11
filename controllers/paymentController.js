const pool = require('../config/db');

async function findPaymentTarget(connection, customerId, saleId, invoiceId) {
  let relatedSale = null;
  let relatedInvoice = null;
  let targetSaleId = saleId || null;

  if (invoiceId) {
    const [invoiceRows] = await connection.execute(
      'SELECT id, sale_id, grand_total, payment_received, remaining_balance FROM invoices WHERE id = ? AND customer_id = ?',
      [invoiceId, customerId]
    );
    if (!invoiceRows.length) {
      throw { statusCode: 404, message: 'Invoice not found' };
    }
    relatedInvoice = invoiceRows[0];
    targetSaleId = relatedInvoice.sale_id;
  }

  if (!targetSaleId) {
    const [saleRows] = await connection.execute(
      `SELECT id FROM sales
       WHERE customer_id = ? AND remaining_balance > 0
       ORDER BY created_at ASC
       LIMIT 1`,
      [customerId]
    );
    targetSaleId = saleRows[0]?.id || null;
  }

  if (targetSaleId) {
    const [saleRows] = await connection.execute(
      'SELECT id, invoice_number, grand_total, payment_received, remaining_balance FROM sales WHERE id = ? AND customer_id = ?',
      [targetSaleId, customerId]
    );
    if (!saleRows.length) {
      throw { statusCode: 404, message: 'Sale not found' };
    }
    relatedSale = saleRows[0];

    if (!relatedInvoice) {
      const [invoiceRows] = await connection.execute(
        'SELECT id, sale_id, grand_total, payment_received, remaining_balance FROM invoices WHERE sale_id = ? AND customer_id = ?',
        [targetSaleId, customerId]
      );
      relatedInvoice = invoiceRows[0] || null;
    }
  }

  return { relatedSale, relatedInvoice, targetSaleId };
}

async function applyPaymentToInvoice(connection, customerId, amount, saleId, invoiceId) {
  const { relatedSale, relatedInvoice, targetSaleId } = await findPaymentTarget(
    connection,
    customerId,
    saleId,
    invoiceId
  );

  if (!relatedSale && !relatedInvoice) {
    return { targetSaleId: null };
  }

  const remaining = Number((relatedInvoice || relatedSale).remaining_balance || 0);
  if (amount > remaining) {
    throw { statusCode: 400, message: 'Payment exceeds invoice remaining balance' };
  }

  const target = relatedInvoice || relatedSale;
  const updatedPaid = Number(target.payment_received || 0) + amount;
  const updatedRemaining = Math.max(0, Number(target.grand_total || 0) - updatedPaid);

  if (relatedInvoice) {
    await connection.execute(
      'UPDATE invoices SET payment_received = ?, remaining_balance = ? WHERE id = ?',
      [updatedPaid, updatedRemaining, relatedInvoice.id]
    );
  }

  if (relatedSale) {
    await connection.execute(
      'UPDATE sales SET payment_received = ?, remaining_balance = ? WHERE id = ?',
      [updatedPaid, updatedRemaining, relatedSale.id]
    );
  }

  return { targetSaleId };
}

async function reversePaymentFromInvoice(connection, customerId, amount, saleId) {
  if (!saleId) {
    return;
  }

  const { relatedSale, relatedInvoice } = await findPaymentTarget(connection, customerId, saleId);
  const target = relatedInvoice || relatedSale;
  if (!target) {
    return;
  }

  const updatedPaid = Math.max(0, Number(target.payment_received || 0) - amount);
  const updatedRemaining = Math.max(0, Number(target.grand_total || 0) - updatedPaid);

  if (relatedInvoice) {
    await connection.execute(
      'UPDATE invoices SET payment_received = ?, remaining_balance = ? WHERE id = ?',
      [updatedPaid, updatedRemaining, relatedInvoice.id]
    );
  }

  if (relatedSale) {
    await connection.execute(
      'UPDATE sales SET payment_received = ?, remaining_balance = ? WHERE id = ?',
      [updatedPaid, updatedRemaining, relatedSale.id]
    );
  }
}

async function addPayment(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { customer_id, amount, payment_method, notes, sale_id, invoice_id } = req.body;
    const paymentAmount = Number(amount || 0);
    if (paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    await connection.beginTransaction();
    const [customerRows] = await connection.execute('SELECT current_balance FROM customers WHERE id = ?', [customer_id]);
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    const previousBalance = customerRows[0].current_balance;
    const newBalance = Math.max(0, Number(previousBalance || 0) - paymentAmount);
    const { targetSaleId } = await applyPaymentToInvoice(connection, customer_id, paymentAmount, sale_id, invoice_id);

    const [paymentResult] = await connection.execute(
      `INSERT INTO payments (customer_id, user_id, sale_id, amount, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [customer_id, req.user.id, targetSaleId || null, paymentAmount, payment_method || 'cash', notes || null]
    );

    await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [newBalance, customer_id]);
    await connection.execute(
      `INSERT INTO ledger_entries (customer_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [customer_id, paymentResult.insertId, 'payment', paymentAmount, previousBalance, newBalance, notes || 'Payment collected']
    );

    await connection.commit();
    res.status(201).json({ success: true, data: { payment_id: paymentResult.insertId, customer_id, amount: paymentAmount, new_balance: newBalance } });
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
       , p.sale_id, s.invoice_number
       FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN sales s ON s.id = p.sale_id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function updatePayment(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { customer_id, amount, payment_method, notes, sale_id, invoice_id } = req.body;
    const paymentAmount = Number(amount || 0);
    if (paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    await connection.beginTransaction();
    const [paymentRows] = await connection.execute('SELECT * FROM payments WHERE id = ?', [id]);
    if (!paymentRows.length) {
      throw { statusCode: 404, message: 'Payment not found' };
    }

    const oldPayment = paymentRows[0];
    const [oldCustomerRows] = await connection.execute('SELECT current_balance FROM customers WHERE id = ?', [oldPayment.customer_id]);
    if (!oldCustomerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    const oldCustomerBalance = Number(oldCustomerRows[0].current_balance || 0);
    const balanceAfterReverse = oldCustomerBalance + Number(oldPayment.amount || 0);
    await reversePaymentFromInvoice(connection, oldPayment.customer_id, Number(oldPayment.amount || 0), oldPayment.sale_id);
    await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [balanceAfterReverse, oldPayment.customer_id]);

    const targetCustomerId = customer_id || oldPayment.customer_id;
    const [customerRows] = await connection.execute('SELECT current_balance FROM customers WHERE id = ?', [targetCustomerId]);
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    const previousBalance = Number(customerRows[0].current_balance || 0);
    const newBalance = Math.max(0, previousBalance - paymentAmount);
    const { targetSaleId } = await applyPaymentToInvoice(connection, targetCustomerId, paymentAmount, sale_id, invoice_id);

    await connection.execute(
      'UPDATE payments SET customer_id = ?, sale_id = ?, amount = ?, payment_method = ?, notes = ? WHERE id = ?',
      [targetCustomerId, targetSaleId || null, paymentAmount, payment_method || 'cash', notes || null, id]
    );
    await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [newBalance, targetCustomerId]);
    await connection.execute(
      `INSERT INTO ledger_entries (customer_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [targetCustomerId, id, 'adjustment', paymentAmount, previousBalance, newBalance, notes || 'Payment updated']
    );

    await connection.commit();
    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function deletePayment(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();
    const [paymentRows] = await connection.execute('SELECT * FROM payments WHERE id = ?', [id]);
    if (!paymentRows.length) {
      throw { statusCode: 404, message: 'Payment not found' };
    }

    const payment = paymentRows[0];
    const [customerRows] = await connection.execute('SELECT current_balance FROM customers WHERE id = ?', [payment.customer_id]);
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    const previousBalance = Number(customerRows[0].current_balance || 0);
    const newBalance = previousBalance + Number(payment.amount || 0);

    await reversePaymentFromInvoice(connection, payment.customer_id, Number(payment.amount || 0), payment.sale_id);
    await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [newBalance, payment.customer_id]);
    await connection.execute(
      `INSERT INTO ledger_entries (customer_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [payment.customer_id, id, 'adjustment', Number(payment.amount || 0), previousBalance, newBalance, 'Payment deleted']
    );
    await connection.execute('DELETE FROM payments WHERE id = ?', [id]);

    await connection.commit();
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = { addPayment, listPayments, updatePayment, deletePayment };
