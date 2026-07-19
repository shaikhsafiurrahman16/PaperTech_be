const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ACCESS_MODULES, ACCESS_ACTIONS, normalizeModules, serializeModules } = require('../config/accessModules');
const { resolvePolicyAssignment } = require('./policyController');

function filterAssignableModules(reqUser, requestedModules) {
  const normalized = normalizeModules(requestedModules) || [];
  if (reqUser.role === 'admin') {
    return normalized.filter((permission) => !permission.startsWith('users'));
  }
  return normalized;
}

function requireCompanyAdminContext(req, res) {
  if (req.user.role !== 'admin' || !req.user.company_id) {
    res.status(403).json({ success: false, message: 'Only company admin can manage company users' });
    return false;
  }
  return true;
}

async function resolveUserPolicy(req, body) {
  const { policy_id, allowed_modules } = body;

  if (policy_id) {
    const assignment = await resolvePolicyAssignment(req.user, policy_id);
    return {
      policy_id: assignment.policy_id,
      allowed_modules: filterAssignableModules(req.user, assignment.allowed_modules),
    };
  }

  return {
    policy_id: null,
    allowed_modules: filterAssignableModules(req.user, allowed_modules),
  };
}

async function listAccessModules(req, res, next) {
  try {
    const modules = req.user.role === 'super_admin'
      ? ACCESS_MODULES
      : ACCESS_MODULES.filter((moduleItem) => moduleItem.key !== 'users');

    res.json({ success: true, data: modules, actions: ACCESS_ACTIONS });
  } catch (error) {
    next(error);
  }
}

async function listCompanyUsers(req, res, next) {
  try {
    if (!requireCompanyAdminContext(req, res)) return;

    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.cnic, u.address, u.username, u.role, u.company_id,
              u.allowed_modules, u.policy_id, p.name AS policy_name, u.created_at
       FROM users u
       LEFT JOIN policies p ON p.id = u.policy_id
       WHERE u.company_id = ? AND u.role = "company_user"
       ORDER BY u.created_at DESC`,
      [req.user.company_id],
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        allowed_modules: normalizeModules(row.allowed_modules) || [],
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function createCompanyUser(req, res, next) {
  try {
    if (!requireCompanyAdminContext(req, res)) return;

    const { full_name, email, cnic, address, username, password } = req.body;
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    let assignment;
    try {
      assignment = await resolveUserPolicy(req, req.body);
    } catch (error) {
      return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }

    if (!assignment.allowed_modules.length) {
      return res.status(400).json({ success: false, message: 'User policy is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, cnic, address, username, password, role, company_id, allowed_modules, policy_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, "company_user", ?, ?, ?, NOW(), NOW())`,
      [
        full_name,
        email || null,
        cnic || null,
        address || null,
        username,
        hashedPassword,
        req.user.company_id,
        serializeModules(assignment.allowed_modules),
        assignment.policy_id,
      ],
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        full_name,
        email: email || null,
        cnic: cnic || null,
        address: address || null,
        username,
        role: 'company_user',
        company_id: req.user.company_id,
        policy_id: assignment.policy_id,
        allowed_modules: assignment.allowed_modules,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateCompanyUser(req, res, next) {
  try {
    if (!requireCompanyAdminContext(req, res)) return;

    const { id } = req.params;
    const { full_name, email, cnic, address, username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND company_id = ? AND role = "company_user"',
      [id, req.user.company_id],
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company user not found' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE username = ? AND id <> ?', [username, id]);
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    let assignment;
    try {
      assignment = await resolveUserPolicy(req, req.body);
    } catch (error) {
      return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }

    if (!assignment.allowed_modules.length) {
      return res.status(400).json({ success: false, message: 'User policy is required' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users
         SET full_name = ?, email = ?, cnic = ?, address = ?, username = ?, password = ?,
             allowed_modules = ?, policy_id = ?, updated_at = NOW()
         WHERE id = ? AND company_id = ? AND role = "company_user"`,
        [
          full_name,
          email || null,
          cnic || null,
          address || null,
          username,
          hashedPassword,
          serializeModules(assignment.allowed_modules),
          assignment.policy_id,
          id,
          req.user.company_id,
        ],
      );
    } else {
      await pool.query(
        `UPDATE users
         SET full_name = ?, email = ?, cnic = ?, address = ?, username = ?,
             allowed_modules = ?, policy_id = ?, updated_at = NOW()
         WHERE id = ? AND company_id = ? AND role = "company_user"`,
        [
          full_name,
          email || null,
          cnic || null,
          address || null,
          username,
          serializeModules(assignment.allowed_modules),
          assignment.policy_id,
          id,
          req.user.company_id,
        ],
      );
    }

    res.json({ success: true, message: 'Company user updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteCompanyUser(req, res, next) {
  try {
    if (!requireCompanyAdminContext(req, res)) return;

    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ? AND company_id = ? AND role = "company_user"',
      [id, req.user.company_id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Company user not found' });
    }

    res.json({ success: true, message: 'Company user deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAccessModules,
  listCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  deleteCompanyUser,
};
