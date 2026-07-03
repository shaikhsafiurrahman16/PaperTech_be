const { hasModuleAccess, hasAnyModuleAction } = require('../config/accessModules');

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    if (req.user.role === 'super_admin') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

function requireModule(moduleKey, actionKey = 'view') {
  return (req, res, next) => {
    if (!req.user || !hasModuleAccess(req.user, moduleKey, actionKey)) {
      return res.status(403).json({ success: false, message: 'Forbidden: module access denied' });
    }
    next();
  };
}

function requireAnyModule(moduleKeys) {
  return (req, res, next) => {
    if (!req.user || !moduleKeys.some((moduleKey) => hasAnyModuleAction(req.user, moduleKey))) {
      return res.status(403).json({ success: false, message: 'Forbidden: module access denied' });
    }
    next();
  };
}

module.exports = { authorize, requireModule, requireAnyModule };
