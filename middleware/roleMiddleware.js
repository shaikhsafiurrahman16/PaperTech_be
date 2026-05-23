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

module.exports = { authorize };
