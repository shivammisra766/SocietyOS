const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../shared/config/prisma');
const { redis, otpStore } = require('../../shared/config/redis');
const { sendMail } = require('../../shared/utils/mailer');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, societyId: user.societyId, flatId: user.flatId || null, profilePicture: user.profilePicture || null, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async ({ name, email, password, phone, role, societyId, flatId }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  // Verify society exists
  const society = await prisma.society.findUnique({ where: { id: societyId } });
  if (!society) throw new Error('Society not found');

  // Verify flat exists if provided
  if (flatId) {
    const flat = await prisma.flat.findUnique({ where: { id: flatId } });
    if (!flat || flat.societyId !== societyId) throw new Error('Flat not found in this society');
  }

  // Only RESIDENT and SECURITY can self-register; ADMIN must be created by another admin
  if (!['RESIDENT', 'SECURITY', 'SERVICE'].includes(role)) {
    throw new Error('Invalid role for registration');
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name, email,
      password: hashed,
      phone, role,
      societyId,
      flatId: role === 'RESIDENT' ? flatId : null,
      status: 'PENDING'
    }
  });

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  if (user.status === 'PENDING') throw new Error('Account pending admin approval');
  if (user.status === 'REJECTED') throw new Error('Account rejected');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user.id, name: user.name, email: user.email,
      role: user.role, flatId: user.flatId, societyId: user.societyId, profilePicture: user.profilePicture
    }
  };
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success to prevent email enumeration, but we could also throw an error.
    return { message: 'If that email is valid, an OTP will be sent.' };
  }

  // Generate 6 digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with 15 mins expiry (900 seconds)
  const otpKey = `reset_otp_${email}`;
  await otpStore.set(otpKey, otp, 900);

  // Send Email with OTP
  // We wrap this in a try/catch to fail gracefully if SMTP is not configured
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendMail({
        to: email,
        subject: 'SocietyOS - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Identity Recovery</h2>
            <p>You requested a password reset for your SocietyOS account.</p>
            <p>Your 6-digit OTP is:</p>
            <h1 style="letter-spacing: 5px; color: #3b82f6;">${otp}</h1>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[AUTH] SMTP credentials missing. Dev OTP: ${otp}`);
    }
  } catch (error) {
    console.error(`[AUTH] Failed to send email to ${email}`, error);
  }

  // Return generic success
  return { message: 'OTP sent successfully' };
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const otpKey = `reset_otp_${email}`;
  const storedOtp = await otpStore.get(otpKey);

  if (!storedOtp) {
    throw new Error('OTP expired or invalid');
  }

  if (storedOtp !== otp) {
    throw new Error('Invalid OTP');
  }

  // Hash new password
  const hashed = await bcrypt.hash(newPassword, 10);

  // Update user in DB
  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  // Clear OTP
  await otpStore.del(otpKey);

  return { message: 'Password reset successfully' };
};

module.exports = { register, login, forgotPassword, resetPassword };