const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const complaintRoutes = require('./modules/complaint/complaint.routes');
const passRoutes = require('./modules/pass/pass.routes');
const entryRoutes = require('./modules/entry/entry.routes');
const noticeRoutes = require('./modules/notice/notice.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const societyRoutes = require('./modules/society/society.routes');
const flatRoutes = require('./modules/flat/flat.routes');
const { errorHandler } = require('./shared/middleware/error.middleware');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again later' }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/entry', entryRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/societies', societyRoutes);
app.use('/api/flats', flatRoutes);

// Dashboard stats endpoint
const { authenticate } = require('./shared/middleware/auth.middleware');
const { authorize } = require('./shared/middleware/rbac.middleware');
const prisma = require('./shared/config/prisma');
const asyncHandler = require('./shared/utils/asyncHandler');

app.get('/api/dashboard/stats', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const societyId = req.user.societyId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalResidents, totalGuards, activePasses, entriesToday, openComplaints, pendingUsers] = await Promise.all([
    prisma.user.count({ where: { societyId, role: 'RESIDENT', status: 'APPROVED' } }),
    prisma.user.count({ where: { societyId, role: 'SECURITY', status: 'APPROVED' } }),
    prisma.pass.count({ where: { societyId, status: 'ACTIVE' } }),
    prisma.entryLog.count({ where: { societyId, entryTime: { gte: today } } }),
    prisma.complaint.count({ where: { societyId, status: 'OPEN' } }),
    prisma.user.count({ where: { societyId, status: 'PENDING' } }),
  ]);

  res.json({
    success: true,
    data: { totalResidents, totalGuards, activePasses, entriesToday, openComplaints, pendingUsers }
  });
}));

// Dashboard chart data endpoint
app.get('/api/dashboard/charts', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const societyId = req.user.societyId;

  // Last 7 days gate activity
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const gateActivity = await Promise.all(
    days.map(async (dayStart) => {
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.entryLog.count({
        where: { societyId, entryTime: { gte: dayStart, lt: dayEnd } }
      });
      return {
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        entries: count
      };
    })
  );

  // Complaint breakdown by category
  const categories = ['PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'OTHER'];
  const complaintBreakdown = await Promise.all(
    categories.map(async (category) => {
      const count = await prisma.complaint.count({ where: { societyId, category } });
      return { name: category.charAt(0) + category.slice(1).toLowerCase(), value: count };
    })
  );

  res.json({
    success: true,
    data: { gateActivity, complaintBreakdown }
  });
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SocietyOS API is running' });
});

app.use(errorHandler);

module.exports = app;