const pool = require('../config/db');
const { increaseProductStock } = require('../utils/inventoryService');

async function createPurchase(req, res, next) {
  const connection = await pool.getConnection();
  try {
    let { vendor_id, items, discount = 0, payment_paid = 0, purchase_type = 'cash' } = req.body;
    discount = Number(discount) || 0;
    payment_paid = Number(payment_paid) || 0;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one purchase item is required' });
    }

    if (!['cash', 'credit'].includes(purchase_type)) {
      return res.status(400).json({ success: false, message: 'Purchase type must be cash or credit' });
    }

    await connection.beginTransaction();

    const [vendorRows] = await connection.execute('SELECT id, current_balance FROM vendors WHERE id = ?', [vendor_id]);
    if (!vendorRows.length) {
      throw { statusCode: 404, message: 'Vendor not found' };
    }

    const purchaseNumber = `PUR-${Date.now()}`;
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
    const paymentPaid = purchase_type === 'cash'
      ? grandTotal
      : Math.max(0, Math.min(payment_paid, grandTotal));
    const remainingBalance = purchase_type === 'cash' ? 0 : Math.max(0, grandTotal - paymentPaid);

    const [purchaseResult] = await connection.execute(
      `INSERT INTO purchases
       (purchase_number, vendor_id, user_id, total_amount, discount, grand_total, payment_paid, remaining_balance, purchase_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [purchaseNumber, vendor_id, req.user.id, totalAmount, discount, grandTotal, paymentPaid, remainingBalance, purchase_type]
    );

    const purchaseId = purchaseResult.insertId;
    for (const item of validatedItems) {
      const subtotal = item.quantity * item.unit_price;
      await connection.execute(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, subtotal, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [purchaseId, item.product_id, item.quantity, item.unit_price, subtotal]
      );
      await increaseProductStock(connection, item.product_id, item.quantity, 'purchase', purchaseId, `Purchase ${purchaseNumber}`);
      await connection.execute('UPDATE products SET cost_price = ? WHERE id = ?', [item.unit_price, item.product_id]);
    }

    const previousBalance = Number(vendorRows[0].current_balance || 0);
    let currentBalance = previousBalance + remainingBalance;
    if (remainingBalance > 0) {
      await connection.execute('UPDATE vendors SET current_balance = ? WHERE id = ?', [currentBalance, vendor_id]);
      await connection.execute(
        `INSERT INTO vendor_ledger_entries
         (vendor_id, purchase_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, NULL, 'purchase', ?, ?, ?, ?, NOW())`,
        [vendor_id, purchaseId, grandTotal, previousBalance, currentBalance, `Purchase ${purchaseNumber}`]
      );
    }

    if (paymentPaid > 0) {
      const [paymentResult] = await connection.execute(
        `INSERT INTO vendor_payments (vendor_id, user_id, purchase_id, amount, payment_method, notes, created_at)
         VALUES (?, ?, ?, ?, 'cash', 'Purchase payment', NOW())`,
        [vendor_id, req.user.id, purchaseId, paymentPaid]
      );
      await connection.execute(
        `INSERT INTO vendor_ledger_entries
         (vendor_id, purchase_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, NOW())`,
        [vendor_id, purchaseId, paymentResult.insertId, paymentPaid, currentBalance, currentBalance, `Payment for ${purchaseNumber}`]
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      data: { purchase_id: purchaseId, purchase_number: purchaseNumber, total_amount: totalAmount, grand_total: grandTotal, remaining_balance: remainingBalance, current_balance: currentBalance },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listPurchases(req, res, next) {
  try {
    const { search, purchase_type, from_date, to_date, vendor_id } = req.query;
    const params = [];
    let query = `SELECT p.id, p.purchase_number, v.company_name, v.full_name, p.total_amount, p.discount, p.grand_total,
       p.payment_paid, p.remaining_balance, p.purchase_type, p.created_at, p.vendor_id
       FROM purchases p
       LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE 1=1`;

    if (req.user && req.user.role === 'vendor') {
      query += ' AND p.vendor_id = ?';
      params.push(req.user.id);
    }

    if (search) {
      query += ' AND (p.purchase_number LIKE ? OR v.company_name LIKE ? OR v.full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (purchase_type) {
      query += ' AND p.purchase_type = ?';
      params.push(purchase_type);
    }

    if (vendor_id) {
      query += ' AND p.vendor_id = ?';
      params.push(vendor_id);
    }

    if (from_date) {
      query += ' AND DATE(p.created_at) >= ?';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND DATE(p.created_at) <= ?';
      params.push(to_date);
    }

    query += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getPurchaseDetails(req, res, next) {
  try {
    const { id } = req.params;
    const [purchaseRows] = await pool.query(
      `SELECT p.*, v.full_name, v.company_name, v.phone, v.username
       FROM purchases p
       LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE p.id = ?`,
      [id]
    );
    if (!purchaseRows.length) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    if (req.user?.role === 'vendor' && Number(purchaseRows[0].vendor_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [items] = await pool.query(
      `SELECT pi.*, pr.name as product_name
       FROM purchase_items pi
       LEFT JOIN products pr ON pr.id = pi.product_id
       WHERE pi.purchase_id = ?`,
      [id]
    );

    res.json({ success: true, data: { purchase: purchaseRows[0], items } });
  } catch (error) {
    next(error);
  }
}

async function updatePurchase(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { purchase_type = 'cash', discount = 0, payment_paid = 0 } = req.body;
    const discountValue = Number(discount) || 0;
    const paymentValue = Number(payment_paid) || 0;

    const [purchaseRows] = await connection.execute('SELECT * FROM purchases WHERE id = ?', [id]);
    if (!purchaseRows.length) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const purchase = purchaseRows[0];
    const [vendorRows] = await connection.execute('SELECT id, current_balance FROM vendors WHERE id = ?', [purchase.vendor_id]);
    if (!vendorRows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const oldGrandTotal = Number(purchase.grand_total || 0);
    const oldPayment = Number(purchase.payment_paid || 0);
    const newGrandTotal = Math.max(0, Number(purchase.total_amount || 0) - discountValue);
    const newPayment = purchase_type === 'cash'
      ? newGrandTotal
      : Math.max(0, Math.min(paymentValue, newGrandTotal));

    if (newPayment < oldPayment) {
      return res.status(400).json({ success: false, message: 'Cannot reduce already paid amount' });
    }

    const newRemaining = purchase_type === 'cash' ? 0 : Math.max(0, newGrandTotal - newPayment);
    const grandDelta = newGrandTotal - oldGrandTotal;
    const paymentDelta = newPayment - oldPayment;

    await connection.beginTransaction();

    await connection.execute(
      `UPDATE purchases
       SET discount = ?, grand_total = ?, payment_paid = ?, remaining_balance = ?, purchase_type = ?, updated_at = NOW()
       WHERE id = ?`,
      [discountValue, newGrandTotal, newPayment, newRemaining, purchase_type, id]
    );

    let runningBalance = Number(vendorRows[0].current_balance || 0);

    if (grandDelta !== 0) {
      const nextBalance = Math.max(0, runningBalance + grandDelta);
      await connection.execute(
        `INSERT INTO vendor_ledger_entries
         (vendor_id, purchase_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, NULL, 'adjustment', ?, ?, ?, ?, NOW())`,
        [purchase.vendor_id, id, Math.abs(grandDelta), runningBalance, nextBalance, `Purchase update ${purchase.purchase_number}`]
      );
      runningBalance = nextBalance;
    }

    if (paymentDelta > 0) {
      const [paymentResult] = await connection.execute(
        `INSERT INTO vendor_payments (vendor_id, user_id, purchase_id, amount, payment_method, notes, created_at)
         VALUES (?, ?, ?, ?, 'cash', 'Additional purchase payment', NOW())`,
        [purchase.vendor_id, req.user.id, id, paymentDelta]
      );
      const nextBalance = Math.max(0, runningBalance - paymentDelta);
      await connection.execute(
        `INSERT INTO vendor_ledger_entries
         (vendor_id, purchase_id, payment_id, transaction_type, amount, previous_balance, current_balance, remarks, created_at)
         VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, NOW())`,
        [purchase.vendor_id, id, paymentResult.insertId, paymentDelta, runningBalance, nextBalance, `Additional payment for ${purchase.purchase_number}`]
      );
      runningBalance = nextBalance;
    }

    await connection.execute('UPDATE vendors SET current_balance = ? WHERE id = ?', [runningBalance, purchase.vendor_id]);
    await connection.commit();

    res.json({
      success: true,
      message: 'Purchase updated successfully',
      data: {
        purchase_id: id,
        grand_total: newGrandTotal,
        payment_paid: newPayment,
        remaining_balance: newRemaining,
        current_balance: runningBalance,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = { createPurchase, listPurchases, getPurchaseDetails, updatePurchase };
