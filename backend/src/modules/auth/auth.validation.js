const { validate } = require('../../shared/middleware/validate.middleware');

const registerSchema = {
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6 },
  phone: { type: 'string' },
  role: { required: true, enum: ['RESIDENT', 'SECURITY', 'SERVICE'] },
  societyId: { required: true, type: 'string' },
};

const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string' },
};

const forgotPasswordSchema = {
  email: { required: true, type: 'email' },
};

const resetPasswordSchema = {
  email: { required: true, type: 'email' },
  otp: { required: true, type: 'string', minLength: 6, maxLength: 6 },
  newPassword: { required: true, type: 'string', minLength: 6 },
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema),
};
