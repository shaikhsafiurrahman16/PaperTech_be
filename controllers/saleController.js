const pool = require('../config/db');
const { updateProductStock } = require('../utils/inventoryService');

async function createSale(req, res, next) {
  const connection = await pool.getConnection();
  try {
    let { customer_id, items, discount = 0, payment_received = 0, sale_type = 'cash' } = req.body;
    discount = Number(discount) || 0;
    payment_received = Number(payment_received) || 0;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one sale item is required' });
    }

    if (!['cash', 'credit'].includes(sale_type)) {
      return res.status(400).json({ success: false, message: 'Sale type must be cash or credit' });
    }

    await connection.beginTransaction();

    let customerId = customer_id;
    if (!customerId) {
      sale_type = 'cash';
      const [walkinRows] = await connection.execute(
        'SELECT id FROM customers WHERE username = ?',
        ['walkin_customer']
      );
      if (walkinRows.length) {
        customerId = walkinRows[0].id;
      } else {
        const [createWalkin] = await connection.execute(
          `INSERT INTO customers (full_name, phone, shop_name, address, cnic, credit_limit, current_balance, username, password, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          ['Walk-in Customer', '0000000000', 'Walk-in Customer', 'Walk-in customer', null, 0, 0, 'walkin_customer', '']
        );
        customerId = createWalkin.insertId;
      }
    }

    const [customerRows] = await connection.execute(
      'SELECT id, current_balance, username FROM customers WHERE id = ?',
      [customerId]
    );
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    const isWalkInCustomer = customerRows[0].username === 'walkin_customer';
    if (isWalkInCustomer && sale_type === 'credit') {
      sale_type = 'cash';
    }

    const invoiceNumber = `INV-${Date.now()}`;
    let totalAmount = 0;
    const validatedItems = items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
    }));

    for (const item of validatedItems) {
      if (!item.product_id || item.quantity <= 0) {
        throw { statusCode: 400, message: 'Product and quantity are required for each item' };
      }
      totalAmount += item.quantity * item.unit_price;
    }

    const grandTotal = Math.max(0, totalAmount - discount);
    const paymentReceived = sale_type === 'cash'
      ? grandTotal
      : Math.max(0, Math.min(payment_received, grandTotal));
    const remainingBalance = sale_type === 'cash' ? 0 : Math.max(0, grandTotal - paymentReceived);

    const [saleResult] = await connection.execute(
      `INSERT INTO sales (invoice_number, customer_id, user_id, total_amount, discount, grand_total, payment_received, remaining_balance, sale_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [invoiceNumber, customerId, req.user.id, totalAmount, discount, grandTotal, paymentReceived, remainingBalance, sale_type]
    );

    const saleId = saleResult.insertId;
    const [invoiceResult] = await connection.execute(
      `INSERT INTO invoices (sale_id, invoice_number, customer_id, user_id, total_amount, discount, grand_total, payment_received, remaining_balance, sale_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [saleId, invoiceNumber, customerId, req.user.id, totalAmount, discount, grandTotal, paymentReceived, remainingBalance, sale_type]
    );

    const invoiceId = invoiceResult.insertId;
    for (const item of validatedItems) {
      const subtotal = item.quantity * item.unit_price;
      await connection.execute(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [saleId, item.product_id, item.quantity, item.unit_price, subtotal]
      );
      await connection.execute(
        `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [invoiceId, item.product_id, item.quantity, item.unit_price, subtotal]
      );
      await updateProductStock(connection, item.product_id, item.quantity, 'sale', saleId, `Sale ${invoiceNumber}`);
    }

    const previousBalance = Number(customerRows[0].current_balance || 0);
    let currentBalance = previousBalance;

    if (remainingBalance > 0) {
      currentBalance += remainingBalance;
      await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [currentBalance, customerId]);
      await connection.execute(
        `INSERT INTO ledger_entries (customer_id, sale_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, NOW())`,
        [customerId, saleId, 'sale', grandTotal, previousBalance, currentBalance, `Sale ${invoiceNumber}`]
      );
    }

    if (paymentReceived > 0) {
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments (customer_id, user_id, sale_id, amount, payment_method, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [customerId, req.user.id, saleId, paymentReceived, 'cash', 'Sale payment']
      );

      const paymentId = paymentResult.insertId;
      await connection.execute(
        `INSERT INTO ledger_entries (customer_id, sale_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [customerId, saleId, paymentId, 'payment', paymentReceived, currentBalance, currentBalance, `Payment for ${invoiceNumber}`]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, data: { sale_id: saleId, invoice_number: invoiceNumber, total_amount: totalAmount, grand_total: grandTotal, remaining_balance: remainingBalance, current_balance: currentBalance } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listSales(req, res, next) {
  try {
    const { search, sale_type, from_date, to_date, customer_id } = req.query;
    const params = [];

    let query = `SELECT s.id, s.invoice_number, c.shop_name, c.full_name, s.total_amount, s.discount, s.grand_total, s.payment_received, s.remaining_balance, s.sale_type, s.created_at, s.customer_id
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE 1=1`;

    if (req.user && req.user.role === 'customer') {
      query += ` AND s.customer_id = ?`;
      params.push(req.user.id);
    }

    if (search) {
      query += ` AND (s.invoice_number LIKE ? OR c.shop_name LIKE ? OR c.full_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (sale_type) {
      query += ` AND s.sale_type = ?`;
      params.push(sale_type);
    }

    if (customer_id) {
      query += ` AND s.customer_id = ?`;
      params.push(customer_id);
    }

    if (from_date) {
      query += ` AND DATE(s.created_at) >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND DATE(s.created_at) <= ?`;
      params.push(to_date);
    }

    query += ` ORDER BY s.created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getSaleDetails(req, res, next) {
  try {
    const { id } = req.params;
    const [saleRows] = await pool.query(
      `SELECT s.*, c.full_name, c.shop_name, c.phone, c.username
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.id = ?`,
      [id]
    );
    if (!saleRows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    if (req.user?.role === 'customer' && Number(saleRows[0].customer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
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

async function updateSale(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { discount = 0, payment_received = 0, sale_type = 'cash' } = req.body;
    const discountValue = Number(discount) || 0;
    const paymentValue = Number(payment_received) || 0;

    const [saleRows] = await connection.execute('SELECT * FROM sales WHERE id = ?', [id]);
    if (!saleRows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const sale = saleRows[0];
    const [customerRows] = await connection.execute('SELECT id, current_balance, username FROM customers WHERE id = ?', [sale.customer_id]);
    if (!customerRows.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customer = customerRows[0];
    const isWalkIn = customer.username === 'walkin_customer';
    let adjustedSaleType = sale_type;
    if (isWalkIn && sale_type === 'credit') {
      adjustedSaleType = 'cash';
    }

    const totalAmount = Number(sale.total_amount);
    const newGrandTotal = Math.max(0, totalAmount - discountValue);
    const newPayment = adjustedSaleType === 'cash' ? newGrandTotal : Math.max(0, Math.min(paymentValue, newGrandTotal));
    if (newPayment < Number(sale.payment_received)) {
      return res.status(400).json({ success: false, message: 'Cannot reduce the already received payment' });
    }

    const newRemaining = adjustedSaleType === 'cash' ? 0 : Math.max(0, newGrandTotal - newPayment);
    const remainingDelta = newRemaining - Number(sale.remaining_balance);
    const paymentDelta = newPayment - Number(sale.payment_received);

    let currentBalance = Number(customer.current_balance || 0) + remainingDelta;

    await connection.beginTransaction();
    await connection.execute(
      `UPDATE sales SET discount = ?, grand_total = ?, payment_received = ?, remaining_balance = ?, sale_type = ?, updated_at = NOW() WHERE id = ?`,
      [discountValue, newGrandTotal, newPayment, newRemaining, adjustedSaleType, id]
    );

    await connection.execute(
      `UPDATE invoices SET total_amount = ?, discount = ?, grand_total = ?, payment_received = ?, remaining_balance = ?, sale_type = ?, updated_at = NOW() WHERE sale_id = ?`,
      [totalAmount, discountValue, newGrandTotal, newPayment, newRemaining, adjustedSaleType, id]
    );

    if (remainingDelta !== 0) {
      await connection.execute(
        `INSERT INTO ledger_entries (customer_id, sale_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, NOW())`,
        [customer.id, id, 'sale', remainingDelta, Number(customer.current_balance || 0), currentBalance, `Sale update ${sale.invoice_number}`]
      );
    }

    if (paymentDelta > 0) {
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments (customer_id, user_id, sale_id, amount, payment_method, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [customer.id, sale.user_id, id, paymentDelta, 'cash', 'Additional sale payment']
      );
      const paymentId = paymentResult.insertId;
      await connection.execute(
        `INSERT INTO ledger_entries (customer_id, sale_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [customer.id, id, paymentId, 'payment', paymentDelta, currentBalance, currentBalance, `Additional payment for ${sale.invoice_number}`]
      );
    }

    await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [currentBalance, customer.id]);
    await connection.commit();
    res.json({ success: true, message: 'Sale updated successfully', data: { current_balance: currentBalance, remaining_balance: newRemaining, payment_received: newPayment, grand_total: newGrandTotal } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function deleteSale(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [saleRows] = await connection.execute('SELECT * FROM sales WHERE id = ?', [id]);
    if (!saleRows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const sale = saleRows[0];
    const [paymentRows] = await connection.execute('SELECT id FROM payments WHERE sale_id = ?', [id]);
    if (paymentRows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete sale with existing payments' });
    }

    const [customerRows] = await connection.execute('SELECT id, current_balance FROM customers WHERE id = ?', [sale.customer_id]);
    if (!customerRows.length) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    await connection.beginTransaction();
    let currentBalance = Number(customerRows[0].current_balance || 0) - Number(sale.remaining_balance || 0);
    currentBalance = Math.max(0, currentBalance);
    await connection.execute('UPDATE customers SET current_balance = ? WHERE id = ?', [currentBalance, sale.customer_id]);
    await connection.execute('DELETE FROM sales WHERE id = ?', [id]);
    await connection.execute('UPDATE ledger_entries SET remarks = CONCAT(remarks, \' [deleted]\') WHERE sale_id = ?', [id]);
    await connection.commit();

    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = { createSale, listSales, getSaleDetails, updateSale, deleteSale };
