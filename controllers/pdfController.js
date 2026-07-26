const pool = require('../config/db');
const { renderHtmlTemplate } = require('../utils/templateRenderer');
const puppeteer = require('puppeteer');

/**
 * Render Sale or Purchase Invoice HTML template with QR Code & Logo
 */
exports.renderInvoiceHtml = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const html = await generateInvoiceHTML(type, id);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate PDF file for Sale or Purchase Invoice
 */
exports.downloadInvoicePdf = async (req, res, next) => {
  let browser;
  try {
    const { type, id } = req.params;
    const html = await generateInvoiceHTML(type, id);
    
    // Get invoice details for filename
    let invoiceNumber = `INV-${id}`;
    if (type === 'purchase') {
      const [rows] = await pool.query('SELECT purchase_number FROM purchases WHERE id = ?', [id]);
      if (rows.length) invoiceNumber = rows[0].purchase_number || `PUR-${id}`;
    } else {
      const [rows] = await pool.query('SELECT invoice_number FROM sales WHERE id = ?', [id]);
      if (rows.length) invoiceNumber = rows[0].invoice_number || `SAL-${id}`;
    }

    // Convert HTML to PDF using Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle2' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      printBackground: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    next(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Helper function to generate Invoice HTML
 */
async function generateInvoiceHTML(type, id) {
  let invoice = null;
  let items = [];
  let company = null;

  if (type === 'purchase') {
    const [rows] = await pool.query(
      `SELECT p.*, v.company_name, v.phone, c.name as company_name_sys, c.id as company_id
       FROM purchases p
       LEFT JOIN vendors v ON p.vendor_id = v.id
       LEFT JOIN companies c ON p.company_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) {
      throw new Error('Purchase invoice not found');
    }
    invoice = rows[0];

    const [itemRows] = await pool.query(
      `SELECT pi.*, prod.name as product_name
       FROM purchase_items pi
       LEFT JOIN products prod ON pi.product_id = prod.id
       WHERE pi.purchase_id = ?`,
      [id]
    );
    items = itemRows;
  } else {
    const [rows] = await pool.query(
      `SELECT s.*, c.shop_name, c.full_name, c.phone, comp.name as company_name_sys, comp.id as company_id
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN companies comp ON s.company_id = comp.id
       WHERE s.id = ?`,
      [id]
    );
    if (!rows.length) {
      throw new Error('Sale invoice not found');
    }
    invoice = rows[0];

    const [itemRows] = await pool.query(
      `SELECT si.*, prod.name as product_name
       FROM sale_items si
       LEFT JOIN products prod ON si.product_id = prod.id
       WHERE si.sale_id = ?`,
      [id]
    );
    items = itemRows;
  }

  // Get company details if available
  if (invoice.company_id) {
    const [companyRows] = await pool.query(
      'SELECT name, code, address, phone FROM companies WHERE id = ?',
      [invoice.company_id]
    );
    if (companyRows.length) {
      company = companyRows[0];
    }
  }

  const isPurchase = type === 'purchase';
  const invoiceNumber = invoice.invoice_number || invoice.purchase_number || `INV-${invoice.id}`;
  const invoiceDate = new Date(invoice.created_at).toLocaleString();
  const partyName = isPurchase
    ? invoice.company_name || 'Vendor'
    : invoice.shop_name || invoice.full_name || 'Walk-in Customer';
  const partyPhone = invoice.phone || 'N/A';
  const partyRole = isPurchase ? 'Vendor' : 'Customer';
  const paymentType = (isPurchase ? invoice.purchase_type : invoice.sale_type) === 'cash' ? 'Cash' : 'Credit';
  const companyNameDisplay = company?.name || invoice.company_name_sys || 'TRADESTACK';

  const tableRowsHtml = items
    .map(
      (item, idx) => `
        <tr>
          <td style="text-align: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">${idx + 1}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9;"><strong>${item.product_name || 'Item'}</strong></td>
          <td style="text-align: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">${item.quantity}</td>
          <td style="text-align: right; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">Rs. ${Number(item.unit_price).toFixed(2)}</td>
          <td style="text-align: right; padding: 10px 14px; border-bottom: 1px solid #f1f5f9;">Rs. ${Number(item.subtotal).toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  const qrData = `https://verify.papertech.local/?doc=${encodeURIComponent(invoiceNumber)}&type=${encodeURIComponent(
    isPurchase ? 'PURCHASE' : 'SALE'
  )}&party=${encodeURIComponent(partyName)}&total=${encodeURIComponent(Number(invoice.grand_total).toFixed(2))}&date=${encodeURIComponent(invoiceDate)}`;

  const html = await renderHtmlTemplate('invoice-template.html', {
    DOCUMENT_TITLE: isPurchase ? 'Purchase Invoice' : 'Sale Invoice',
    DOCUMENT_TYPE: isPurchase ? 'Purchase Invoice' : 'Sale Invoice',
    INVOICE_NUMBER: invoiceNumber,
    INVOICE_DATE: invoiceDate,
    PARTY_ROLE: partyRole,
    PARTY_NAME: partyName,
    PARTY_PHONE: partyPhone,
    PAYMENT_TYPE_LABEL: paymentType,
    TABLE_ROWS: tableRowsHtml,
    TOTAL_AMOUNT: Number(invoice.total_amount || 0).toFixed(2),
    DISCOUNT: Number(invoice.discount || 0).toFixed(2),
    GRAND_TOTAL: Number(invoice.grand_total || 0).toFixed(2),
    PAID_LABEL: isPurchase ? 'Payment Paid' : 'Payment Received',
    PAYMENT_PAID: Number(isPurchase ? invoice.payment_paid : invoice.payment_received || 0).toFixed(2),
    REMAINING_BALANCE: Number(invoice.remaining_balance || 0).toFixed(2),
    QR_DATA: qrData,
    COMPANY_NAME: companyNameDisplay,
    COPY_TAG: 'ORIGINAL',
  });

  return html;
}

module.exports.generateInvoiceHTML = generateInvoiceHTML;
