const pool = require('../config/db');

async function dashboardSummary(req, res, next) {
  try {
    const [salesRows] = await pool.query('SELECT SUM(grand_total) as total_sales, COUNT(*) as total_invoices FROM sales');
    const [customersRows] = await pool.query('SELECT COUNT(*) as total_customers FROM customers');
    const [stockRows] = await pool.query('SELECT SUM(current_stock) as total_stock FROM products');
    const [pendingRows] = await pool.query('SELECT SUM(current_balance) as total_pending_payments FROM customers');
    const [lowStockRows] = await pool.query('SELECT COUNT(*) as low_stock_count FROM products WHERE current_stock <= min_stock_alert');

    res.json({
      success: true,
      data: {
        total_sales: salesRows[0].total_sales || 0,
        total_customers: customersRows[0].total_customers || 0,
        total_stock: stockRows[0].total_stock || 0,
        total_pending_payments: pendingRows[0].total_pending_payments || 0,
        low_stock_alerts: lowStockRows[0].low_stock_count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function monthlySales(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as period, SUM(grand_total) as total_sales, SUM(payment_received) as total_received
       FROM sales
       GROUP BY period
       ORDER BY period DESC
       LIMIT 12`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function outstandingBalances(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, shop_name, phone, current_balance FROM customers WHERE current_balance > 0 ORDER BY current_balance DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function stockReport(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, name, product_type, current_stock, min_stock_alert FROM products ORDER BY current_stock ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function profitReport(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(s.created_at, '%Y-%m-%d') as date,
              SUM((si.unit_price - p.cost_price) * si.quantity) as profit
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       LEFT JOIN sales s ON s.id = si.sale_id
       GROUP BY date
       ORDER BY date DESC
       LIMIT 30`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = { dashboardSummary, monthlySales, outstandingBalances, stockReport, profitReport };
