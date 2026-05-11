const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0]?.msg || 'Please check the form fields',
      errors: errors.array().map(err => ({ field: err.path || err.param, message: err.msg })),
    });
  }
  next();
}

module.exports = { validateRequest };
