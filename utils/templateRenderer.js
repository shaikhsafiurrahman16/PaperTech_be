const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * Generate a QR code as Data URL (base64 PNG)
 * QR Code contains verification data that can be scanned to verify invoice authenticity
 */
async function generateQRCodeDataURL(text) {
  try {
    const qrString = text || 'TRADESTACK_VERIFICATION';
    return await QRCode.toDataURL(qrString, {
      margin: 1,
      width: 200,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction for better scannability
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Helper to replace {{KEY}} placeholders in an HTML template string
 */
function replacePlaceholders(templateStr, data) {
  let result = templateStr;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value !== undefined && value !== null ? String(value) : '');
  }
  return result;
}

/**
 * Load HTML template from file and render with given data
 * This function generates complete invoice templates with QR codes for verification
 */
async function renderHtmlTemplate(templateFileName, data = {}) {
  const templatePath = path.join(__dirname, '..', 'templates', templateFileName);
  let templateContent = fs.readFileSync(templatePath, 'utf8');

  // Prepare QR code data.
  // Prefer a compact, scan-friendly URL so mobile scanners can open the verification payload directly.
  const qrString = data.QR_DATA ||
    `https://verify.papertech.local/?doc=${encodeURIComponent(data.INVOICE_NUMBER || data.RECEIPT_NUMBER || 'REF')}&date=${encodeURIComponent(new Date().toISOString())}&company=${encodeURIComponent(data.COMPANY_NAME || 'TRADESTACK')}`;
  
  const qrCodeDataUrl = await generateQRCodeDataURL(qrString);

  const mergedData = {
    COMPANY_NAME: 'TRADESTACK',
    COPY_TAG: 'ORIGINAL',
    GENERATED_AT: new Date().toLocaleString(),
    VERIFICATION_REF: `TS-${Math.floor(100000 + Math.random() * 900000)}`,
    QR_CODE_DATA_URL: qrCodeDataUrl,
    ...data, // User-provided data overrides defaults
  };

  return replacePlaceholders(templateContent, mergedData);
}

module.exports = {
  renderHtmlTemplate,
  generateQRCodeDataURL,
};
