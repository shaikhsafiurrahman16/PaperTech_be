const pool = require('../config/db');

function addDateFilters(baseQuery, params, tableAlias, fromDate, toDate) {
  let query = baseQuery;
  if (fromDate) {
    query += ` AND DATE(${tableAlias}.created_at) >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    query += ` AND DATE(${tableAlias}.created_at) <= ?`;
    params.push(toDate);
  }
  return query;
}

async function dashboardSummary(req, res, next) {
  try {
    const { from_date, to_date } = req.query;
    const salesParams = [req.user.company_id];
    const customerParams = [req.user.company_id];
    const vendorParams = [req.user.company_id];
    const salesQuery = addDateFilters(
      `SELECT
        COUNT(*) AS total_sales,
        SUM(grand_total) AS total_revenue,
        SUM(payment_received) AS total_paid_amount,
        SUM(CASE WHEN remaining_balance > 0 THEN 1 ELSE 0 END) AS pending_invoices,
        SUM(remaining_balance) AS pending_amount
       FROM sales s WHERE s.company_id = ?`,
      salesParams,
      's',
      from_date,
      to_date
    );
    const customersQuery = addDateFilters(
      'SELECT COUNT(*) as total_customers FROM customers c WHERE c.company_id = ?',
      customerParams,
      'c',
      from_date,
      to_date
    );
    const vendorsQuery = addDateFilters(
      'SELECT COUNT(*) as total_vendors FROM vendors v WHERE v.company_id = ?',
      vendorParams,
      'v',
      from_date,
      to_date
    );

    const [salesRows] = await pool.query(salesQuery, salesParams);
    const [customersRows] = await pool.query(customersQuery, customerParams);
    const [vendorsRows] = await pool.query(vendorsQuery, vendorParams);
    const [stockRows] = await pool.query('SELECT SUM(current_stock) as total_stock FROM products WHERE company_id = ?', [req.user.company_id]);
    const [lowStockRows] = await pool.query('SELECT COUNT(*) as low_stock_count FROM products WHERE company_id = ? AND current_stock <= min_stock_alert', [req.user.company_id]);

    res.json({
      success: true,
      data: {
        total_sales: salesRows[0].total_sales || 0,
        total_revenue: salesRows[0].total_revenue || 0,
        total_paid_amount: salesRows[0].total_paid_amount || 0,
        pending_invoices: salesRows[0].pending_invoices || 0,
        pending_amount: salesRows[0].pending_amount || 0,
        total_customers: customersRows[0].total_customers || 0,
        total_vendors: vendorsRows[0].total_vendors || 0,
        total_stock: stockRows[0].total_stock || 0,
        low_stock_alerts: lowStockRows[0].low_stock_count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function monthlySales(req, res, next) {
  try {
    const { from_date, to_date } = req.query;
    const params = [];
    let query =
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as period, SUM(grand_total) as total_sales, SUM(payment_received) as total_received
       FROM sales
       WHERE company_id = ?`;
    params.push(req.user.company_id);

    query = addDateFilters(query, params, 'sales', from_date, to_date);
    query += ` GROUP BY period
       ORDER BY period DESC
       LIMIT 12`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function outstandingBalances(req, res, next) {
  try {
    const { from_date, to_date } = req.query;
    if (!from_date && !to_date) {
      const [rows] = await pool.query(
        'SELECT id, full_name, shop_name, phone, current_balance FROM customers WHERE company_id = ? AND current_balance > 0 ORDER BY current_balance DESC',
        [req.user.company_id]
      );
      return res.json({ success: true, data: rows });
    }

    const params = [];
    let query = `SELECT c.id, c.full_name, c.shop_name, c.phone,
              COALESCE(SUM(s.remaining_balance), 0) as current_balance
       FROM customers c
       LEFT JOIN sales s ON s.customer_id = c.id
       WHERE c.company_id = ?`;
    params.push(req.user.company_id);

    query = addDateFilters(query, params, 's', from_date, to_date);
    query += ` GROUP BY c.id, c.full_name, c.shop_name, c.phone, c.current_balance
       HAVING current_balance > 0
       ORDER BY current_balance DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function stockReport(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, name, product_type, current_stock, min_stock_alert FROM products WHERE company_id = ? ORDER BY current_stock ASC', [req.user.company_id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function profitReport(req, res, next) {
  try {
    const { from_date, to_date } = req.query;
    const params = [];
    let query =
      `SELECT DATE_FORMAT(s.created_at, '%Y-%m-%d') as date,
              SUM((si.unit_price - p.cost_price) * si.quantity) as profit
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       LEFT JOIN sales s ON s.id = si.sale_id
       WHERE s.company_id = ?`;
    params.push(req.user.company_id);

    query = addDateFilters(query, params, 's', from_date, to_date);
    query += ` GROUP BY date
       ORDER BY date DESC
       LIMIT 30`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = { dashboardSummary, monthlySales, outstandingBalances, stockReport, profitReport };
