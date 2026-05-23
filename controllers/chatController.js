const pool = require('../config/db');

const ALLOWED_ROLES = new Set(['admin', 'vendor', 'customer']);

function normalizeRole(role) {
  return String(role || '').toLowerCase();
}

function getDisplayName(role, row) {
  if (role === 'admin') return row.full_name || row.username || `Admin #${row.id}`;
  if (role === 'vendor') return row.company_name || row.full_name || row.username || `Vendor #${row.id}`;
  return row.shop_name || row.full_name || row.username || `Customer #${row.id}`;
}

async function listContacts(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      const [vendors] = await pool.query(
        'SELECT id, full_name, company_name, username FROM vendors WHERE company_id = ? ORDER BY company_name ASC',
        [req.user.company_id]
      );
      const [customers] = await pool.query(
        "SELECT id, full_name, shop_name, username FROM customers WHERE company_id = ? AND username != ? ORDER BY shop_name ASC",
        [req.user.company_id, 'walkin_customer']
      );

      const contacts = [
        ...vendors.map((item) => ({
          id: item.id,
          role: 'vendor',
          name: getDisplayName('vendor', item),
          subtitle: item.full_name || item.username || '',
          unread_count: 0,
        })),
        ...customers.map((item) => ({
          id: item.id,
          role: 'customer',
          name: getDisplayName('customer', item),
          subtitle: item.full_name || item.username || '',
          unread_count: 0,
        })),
      ];

      if (contacts.length > 0) {
        const [unreadRows] = await pool.query(
          `SELECT sender_role, sender_id, COUNT(*) AS unread_count
           FROM chat_messages
           WHERE company_id = ? AND receiver_role = ? AND receiver_id = ? AND is_read = 0
           GROUP BY sender_role, sender_id`,
          [req.user.company_id, req.user.role, req.user.id]
        );
        const unreadMap = new Map(
          unreadRows.map((row) => [`${row.sender_role}:${row.sender_id}`, Number(row.unread_count || 0)])
        );
        contacts.forEach((contact) => {
          contact.unread_count = unreadMap.get(`${contact.role}:${contact.id}`) || 0;
        });
      }

      return res.json({ success: true, data: contacts });
    }

    const [admins] = await pool.query(
      "SELECT id, full_name, username FROM users WHERE role = 'admin' AND company_id = ? ORDER BY id ASC",
      [req.user.company_id]
    );
    const contacts = admins.map((item) => ({
      id: item.id,
      role: 'admin',
      name: getDisplayName('admin', item),
      subtitle: item.username || '',
      unread_count: 0,
    }));

    if (contacts.length > 0) {
      const [unreadRows] = await pool.query(
        `SELECT sender_role, sender_id, COUNT(*) AS unread_count
         FROM chat_messages
         WHERE company_id = ? AND receiver_role = ? AND receiver_id = ? AND is_read = 0
         GROUP BY sender_role, sender_id`,
        [req.user.company_id, req.user.role, req.user.id]
      );
      const unreadMap = new Map(
        unreadRows.map((row) => [`${row.sender_role}:${row.sender_id}`, Number(row.unread_count || 0)])
      );
      contacts.forEach((contact) => {
        contact.unread_count = unreadMap.get(`${contact.role}:${contact.id}`) || 0;
      });
    }

    return res.json({ success: true, data: contacts });
  } catch (error) {
    return next(error);
  }
}

function canChatWith(currentRole, targetRole) {
  if (currentRole === 'admin') return targetRole === 'vendor' || targetRole === 'customer';
  if (currentRole === 'vendor' || currentRole === 'customer') return targetRole === 'admin';
  return false;
}

async function validateTarget(companyId, role, id) {
  if (role === 'admin') {
    const [rows] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'admin' AND company_id = ?", [id, companyId]);
    return rows.length > 0;
  }
  if (role === 'vendor') {
    const [rows] = await pool.query('SELECT id FROM vendors WHERE id = ? AND company_id = ?', [id, companyId]);
    return rows.length > 0;
  }
  const [rows] = await pool.query('SELECT id FROM customers WHERE id = ? AND company_id = ?', [id, companyId]);
  return rows.length > 0;
}

async function listMessages(req, res, next) {
  try {
    const participantRole = normalizeRole(req.params.participantRole);
    const participantId = Number(req.params.participantId);

    if (!ALLOWED_ROLES.has(participantRole) || !Number.isInteger(participantId) || participantId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid participant details' });
    }

    if (!canChatWith(req.user.role, participantRole)) {
      return res.status(403).json({ success: false, message: 'Chat not allowed for selected participant' });
    }

    const isValidTarget = await validateTarget(req.user.company_id, participantRole, participantId);
    if (!isValidTarget) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    const [messages] = await pool.query(
      `SELECT id, sender_role, sender_id, receiver_role, receiver_id, message, is_read, created_at
       FROM chat_messages
       WHERE
          company_id = ? AND (
          (sender_role = ? AND sender_id = ? AND receiver_role = ? AND receiver_id = ?)
          OR
          (sender_role = ? AND sender_id = ? AND receiver_role = ? AND receiver_id = ?)
          )
       ORDER BY created_at ASC, id ASC`,
      [
        req.user.company_id,
        req.user.role, req.user.id, participantRole, participantId,
        participantRole, participantId, req.user.role, req.user.id,
      ]
    );

    await pool.query(
      `UPDATE chat_messages
       SET is_read = 1
       WHERE company_id = ? AND receiver_role = ? AND receiver_id = ? AND sender_role = ? AND sender_id = ? AND is_read = 0`,
      [req.user.company_id, req.user.role, req.user.id, participantRole, participantId]
    );

    return res.json({ success: true, data: messages });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const participantRole = normalizeRole(req.params.participantRole);
    const participantId = Number(req.params.participantId);
    const text = String(req.body.message || '').trim();

    if (!ALLOWED_ROLES.has(participantRole) || !Number.isInteger(participantId) || participantId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid participant details' });
    }
    if (!canChatWith(req.user.role, participantRole)) {
      return res.status(403).json({ success: false, message: 'Chat not allowed for selected participant' });
    }
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message is too long' });
    }

    const isValidTarget = await validateTarget(req.user.company_id, participantRole, participantId);
    if (!isValidTarget) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO chat_messages
       (company_id, sender_role, sender_id, receiver_role, receiver_id, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [req.user.company_id, req.user.role, req.user.id, participantRole, participantId, text]
    );

    return res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        sender_role: req.user.role,
        sender_id: req.user.id,
        receiver_role: participantRole,
        receiver_id: participantId,
        message: text,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function unreadSummary(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total_unread,
        COALESCE(MAX(id), 0) AS latest_incoming_message_id
       FROM chat_messages
       WHERE company_id = ? AND receiver_role = ? AND receiver_id = ? AND is_read = 0`,
      [req.user.company_id, req.user.role, req.user.id]
    );

    return res.json({
      success: true,
      data: {
        total_unread: Number(rows[0]?.total_unread || 0),
        latest_incoming_message_id: Number(rows[0]?.latest_incoming_message_id || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listContacts, listMessages, sendMessage, unreadSummary };
