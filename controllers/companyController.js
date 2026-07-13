const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { serializeModules, normalizeModules } = require('../config/accessModules');
const { resolvePolicyAssignment } = require('./policyController');

async function createCompany(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      name,
      code,
      field_type,
      address,
      phone,
      admin_full_name,
      admin_username,
      admin_password,
      admin_allowed_modules,
      policy_id,
    } = req.body;

    let adminModules = normalizeModules(admin_allowed_modules) || [];
    let adminPolicyId = null;

    if (policy_id) {
      const assignment = await resolvePolicyAssignment(req.user, policy_id);
      adminModules = assignment.allowed_modules;
      adminPolicyId = assignment.policy_id;
    }

    if (!adminModules.length) {
      return res.status(400).json({ success: false, message: 'Admin policy is required' });
    }

    const [exists] = await connection.query('SELECT id FROM companies WHERE name = ? OR code = ?', [name, code]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Company already exists' });
    }
    const [adminExists] = await connection.query('SELECT id FROM users WHERE username = ?', [admin_username]);
    if (adminExists.length) {
      return res.status(409).json({ success: false, message: 'Admin username already exists' });
    }

    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO companies (name, code, field_type, address, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, "active", NOW(), NOW())',
      [name, code, field_type || 'paper', address || null, phone || null],
    );
    const hashedAdminPassword = await bcrypt.hash(admin_password, 10);
    const [adminResult] = await connection.query(
      'INSERT INTO users (full_name, username, password, role, company_id, allowed_modules, policy_id, created_at, updated_at) VALUES (?, ?, ?, "admin", ?, ?, ?, NOW(), NOW())',
      [admin_full_name || 'Company Admin', admin_username, hashedAdminPassword, result.insertId, serializeModules(adminModules), adminPolicyId],
    );
    await connection.commit();
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        code,
        field_type: field_type || 'paper',
        address: address || null,
        phone: phone || null,
        status: 'active',
        admin: {
          id: adminResult.insertId,
          full_name: admin_full_name || 'Company Admin',
          username: admin_username,
          policy_id: adminPolicyId,
          allowed_modules: adminModules,
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  } finally {
    connection.release();
  }
}

async function listCompanies(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.code,
         c.field_type,
         c.address,
         c.phone,
         c.status,
         c.created_at,
         u.id AS admin_id,
         u.full_name AS admin_full_name,
         u.username AS admin_username,
         u.policy_id AS admin_policy_id,
         u.allowed_modules AS admin_allowed_modules
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id AND u.role = 'admin'
       ORDER BY c.created_at DESC`,
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        field_type: row.field_type || 'paper',
        address: row.address,
        phone: row.phone,
        status: row.status,
        created_at: row.created_at,
        admin: row.admin_id
          ? {
              id: row.admin_id,
              full_name: row.admin_full_name,
              username: row.admin_username,
              policy_id: row.admin_policy_id,
              allowed_modules: normalizeModules(row.admin_allowed_modules) || [],
            }
          : null,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function getCompany(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.code,
         c.field_type,
         c.address,
         c.phone,
         c.status,
         c.created_at,
         c.updated_at,
         u.id AS admin_id,
         u.full_name AS admin_full_name,
         u.username AS admin_username,
         u.policy_id AS admin_policy_id,
         u.allowed_modules AS admin_allowed_modules
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id AND u.role = 'admin'
       WHERE c.id = ?`,
      [id],
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const row = rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        code: row.code,
        field_type: row.field_type || 'paper',
        address: row.address,
        phone: row.phone,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        admin: row.admin_id
          ? {
              id: row.admin_id,
              full_name: row.admin_full_name,
              username: row.admin_username,
              policy_id: row.admin_policy_id,
              allowed_modules: normalizeModules(row.admin_allowed_modules) || [],
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateCompany(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, code, field_type, address, phone, status, policy_id, admin_allowed_modules, admin_full_name, admin_username, admin_password } = req.body;

    const [rows] = await connection.query('SELECT id FROM companies WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    let adminModules = null;
    let adminPolicyId = null;

    if (policy_id || admin_allowed_modules) {
      if (policy_id) {
        const assignment = await resolvePolicyAssignment(req.user, policy_id);
        adminModules = assignment.allowed_modules;
        adminPolicyId = assignment.policy_id;
      } else {
        adminModules = normalizeModules(admin_allowed_modules) || [];
      }

      if (!adminModules.length) {
        return res.status(400).json({ success: false, message: 'Admin policy is required' });
      }
    }

    await connection.beginTransaction();
    await connection.query(
      'UPDATE companies SET name = ?, code = ?, field_type = ?, address = ?, phone = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [name, code, field_type || 'paper', address || null, phone || null, status || 'active', id],
    );

    if (adminModules) {
      await connection.query(
        'UPDATE users SET allowed_modules = ?, policy_id = ?, updated_at = NOW() WHERE company_id = ? AND role = "admin"',
        [serializeModules(adminModules), adminPolicyId, id],
      );
    }

    const adminUpdates = [];
    const adminValues = [];
    if (admin_full_name) {
      adminUpdates.push('full_name = ?');
      adminValues.push(admin_full_name);
    }
    if (admin_username) {
      const [usernameRows] = await connection.query(
        'SELECT id FROM users WHERE username = ? AND NOT (company_id = ? AND role = "admin")',
        [admin_username, id],
      );
      if (usernameRows.length) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'Admin username already exists' });
      }
      adminUpdates.push('username = ?');
      adminValues.push(admin_username);
    }
    if (admin_password) {
      adminUpdates.push('password = ?');
      adminValues.push(await bcrypt.hash(admin_password, 10));
    }
    if (adminUpdates.length) {
      await connection.query(
        `UPDATE users SET ${adminUpdates.join(', ')}, updated_at = NOW() WHERE company_id = ? AND role = "admin"`,
        [...adminValues, id],
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Company updated successfully' });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  } finally {
    connection.release();
  }
}

async function deleteCompany(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id FROM companies WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const [usageRows] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE company_id = ?) AS users_count,
        (SELECT COUNT(*) FROM customers WHERE company_id = ?) AS customers_count,
        (SELECT COUNT(*) FROM vendors WHERE company_id = ?) AS vendors_count,
        (SELECT COUNT(*) FROM sales WHERE company_id = ?) AS sales_count,
        (SELECT COUNT(*) FROM purchases WHERE company_id = ?) AS purchases_count`,
      [id, id, id, id, id],
    );
    const usage = usageRows[0];
    if (Number(usage.users_count || 0) > 0 || Number(usage.customers_count || 0) > 0 || Number(usage.vendors_count || 0) > 0 || Number(usage.sales_count || 0) > 0 || Number(usage.purchases_count || 0) > 0) {
      return res.status(400).json({ success: false, message: 'Company has linked data and cannot be deleted' });
    }
    await pool.query('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { createCompany, listCompanies, getCompany, updateCompany, deleteCompany };
