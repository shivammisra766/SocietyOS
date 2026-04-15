const router = require('express').Router();
const { register, login, forgotPassword, resetPassword } = require('./auth.controller');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('./auth.validation');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

module.exports = router;