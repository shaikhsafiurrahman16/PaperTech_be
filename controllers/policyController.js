const pool = require('../config/db');
const { normalizeModules, serializeModules } = require('../config/accessModules');

function mapPolicyRow(row) {
  return {
    ...row,
    allowed_modules: normalizeModules(row.allowed_modules) || [],
  };
}

function canAccessPolicy(reqUser, policy) {
  if (reqUser.role === 'super_admin') {
    return policy.company_id == null;
  }
  if (reqUser.role === 'admin') {
    return Number(policy.company_id) === Number(reqUser.company_id);
  }
  return false;
}

function canManagePolicy(reqUser, policy) {
  return canAccessPolicy(reqUser, policy);
}

async function listPolicies(req, res, next) {
  try {
    if (req.user.role === 'super_admin') {
      const [rows] = await pool.query(
        `SELECT id, name, description, allowed_modules, company_id, created_at, updated_at
         FROM policies
         WHERE company_id IS NULL
         ORDER BY created_at DESC`,
      );
      return res.json({ success: true, data: rows.map(mapPolicyRow) });
    }

    if (req.user.role === 'admin') {
      const [rows] = await pool.query(
        `SELECT id, name, description, allowed_modules, company_id, created_at, updated_at
         FROM policies
         WHERE company_id = ?
         ORDER BY created_at DESC`,
        [req.user.company_id],
      );
      return res.json({ success: true, data: rows.map(mapPolicyRow) });
    }

    return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
  } catch (error) {
    next(error);
  }
}

async function getPolicy(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, description, allowed_modules, company_id, created_at, updated_at FROM policies WHERE id = ?',
      [id],
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    const policy = rows[0];
    if (!canAccessPolicy(req.user, policy)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }

    res.json({ success: true, data: mapPolicyRow(policy) });
  } catch (error) {
    next(error);
  }
}

async function createPolicy(req, res, next) {
  try {
    const { name, description, allowed_modules } = req.body;
    const companyId = req.user.role === 'admin' ? req.user.company_id : null;
    const normalizedModules = normalizeModules(allowed_modules) || [];

    if (!normalizedModules.length) {
      return res.status(400).json({ success: false, message: 'At least one permission is required' });
    }

    const [exists] = await pool.query(
      'SELECT id FROM policies WHERE name = ? AND company_id <=> ?',
      [name, companyId],
    );
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Policy name already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO policies (name, description, allowed_modules, company_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, description || null, serializeModules(normalizedModules), companyId],
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        description: description || null,
        allowed_modules: normalizedModules,
        company_id: companyId,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updatePolicy(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, allowed_modules } = req.body;

    const [rows] = await pool.query('SELECT * FROM policies WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    const policy = rows[0];
    if (!canManagePolicy(req.user, policy)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }

    const normalizedModules = normalizeModules(allowed_modules) || [];
    if (!normalizedModules.length) {
      return res.status(400).json({ success: false, message: 'At least one permission is required' });
    }

    const companyId = policy.company_id;
    const [exists] = await pool.query(
      'SELECT id FROM policies WHERE name = ? AND company_id <=> ? AND id <> ?',
      [name, companyId, id],
    );
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Policy name already exists' });
    }

    await pool.query(
      'UPDATE policies SET name = ?, description = ?, allowed_modules = ?, updated_at = NOW() WHERE id = ?',
      [name, description || null, serializeModules(normalizedModules), id],
    );

    res.json({ success: true, message: 'Policy updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deletePolicy(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM policies WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    const policy = rows[0];
    if (!canManagePolicy(req.user, policy)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }

    const [usageRows] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE policy_id = ?', [id]);
    if (Number(usageRows[0]?.count || 0) > 0) {
      return res.status(400).json({ success: false, message: 'Policy is assigned to users and cannot be deleted' });
    }

    await pool.query('DELETE FROM policies WHERE id = ?', [id]);
    res.json({ success: true, message: 'Policy deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function resolvePolicyAssignment(reqUser, policyId) {
  const [rows] = await pool.query(
    'SELECT id, allowed_modules, company_id FROM policies WHERE id = ?',
    [policyId],
  );

  if (!rows.length) {
    const error = new Error('Policy not found');
    error.statusCode = 404;
    throw error;
  }

  const policy = rows[0];
  if (!canAccessPolicy(reqUser, policy)) {
    const error = new Error('Policy not available');
    error.statusCode = 403;
    throw error;
  }

  return {
    policy_id: policy.id,
    allowed_modules: normalizeModules(policy.allowed_modules) || [],
  };
}

module.exports = {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  resolvePolicyAssignment,
};
