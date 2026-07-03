const ACCESS_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'customers', label: 'Customers' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'products', label: 'Products' },
  { key: 'sales', label: 'Sales' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'reports', label: 'Reports' },
  { key: 'chat', label: 'Chat Support' },
];

const ACCESS_MODULE_KEYS = ACCESS_MODULES.map((moduleItem) => moduleItem.key);
const ACCESS_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Add' },
  { key: 'update', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];
const ACCESS_ACTION_KEYS = ACCESS_ACTIONS.map((action) => action.key);

const MODULE_ACTIONS = {
  dashboard: ['view'],
  users: ['view', 'create', 'update', 'delete'],
  customers: ['view', 'create', 'update', 'delete'],
  vendors: ['view', 'create', 'update', 'delete'],
  purchases: ['view', 'create', 'update', 'delete'],
  products: ['view', 'create', 'update', 'delete'],
  sales: ['view', 'create', 'update', 'delete'],
  invoices: ['view', 'create', 'update', 'delete'],
  payments: ['view', 'create', 'update', 'delete'],
  reports: ['view'],
  chat: ['view'],
};

function getActionsForModule(moduleKey) {
  return MODULE_ACTIONS[moduleKey] || ACCESS_ACTION_KEYS;
}

function getModulesForPolicyCreator(role) {
  if (role === 'super_admin') {
    return ACCESS_MODULES;
  }
  return ACCESS_MODULES.filter((moduleItem) => moduleItem.key !== 'users');
}

function isValidPermission(permission) {
  if (ACCESS_MODULE_KEYS.includes(permission)) {
    return true;
  }

  const [moduleKey, actionKey] = String(permission).split('.');
  return ACCESS_MODULE_KEYS.includes(moduleKey) && getActionsForModule(moduleKey).includes(actionKey);
}

function normalizeModules(modules) {
  if (modules == null || modules === '') {
    return null;
  }

  let parsed = modules;
  if (typeof modules === 'string') {
    try {
      parsed = JSON.parse(modules);
    } catch (error) {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return [...new Set(parsed.filter((permission) => isValidPermission(permission)))];
}

function serializeModules(modules) {
  return JSON.stringify(normalizeModules(modules) || []);
}

function hasModuleAccess(user, moduleKey, actionKey = 'view') {
  if (!moduleKey || user?.role === 'super_admin') {
    return true;
  }

  const allowedModules = normalizeModules(user?.allowed_modules);
  if (allowedModules === null) {
    return true;
  }

  return allowedModules.includes(moduleKey) || allowedModules.includes(`${moduleKey}.${actionKey}`);
}

function hasAnyModuleAction(user, moduleKey) {
  if (!moduleKey || user?.role === 'super_admin') {
    return true;
  }

  const allowedModules = normalizeModules(user?.allowed_modules);
  if (allowedModules === null) {
    return true;
  }

  return allowedModules.includes(moduleKey) || getActionsForModule(moduleKey).some((actionKey) => allowedModules.includes(`${moduleKey}.${actionKey}`));
}

module.exports = {
  ACCESS_MODULES,
  ACCESS_MODULE_KEYS,
  ACCESS_ACTIONS,
  ACCESS_ACTION_KEYS,
  MODULE_ACTIONS,
  getActionsForModule,
  getModulesForPolicyCreator,
  normalizeModules,
  serializeModules,
  hasModuleAccess,
  hasAnyModuleAction,
};
