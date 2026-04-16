const prisma = require('../../shared/config/prisma');

const getProfile = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true, flat: true, society: true, flatId: true, societyId: true, profilePicture: true }
  });
};

const updateProfile = async (userId, data) => {
  const allowed = {};
  if (data.name) allowed.name = data.name;
  if (data.phone) allowed.phone = data.phone;
  if (data.profilePicture) allowed.profilePicture = data.profilePicture;

  return await prisma.user.update({
    where: { id: userId },
    data: allowed,
    select: { id: true, name: true, email: true, phone: true, role: true, profilePicture: true }
  });
};

const updateUser = async (userId, societyId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.societyId !== societyId) throw new Error('User not found');

  const allowed = {};
  if (data.name) allowed.name = data.name;
  if (data.phone) allowed.phone = data.phone;
  if (data.email) allowed.email = data.email;

  return await prisma.user.update({
    where: { id: userId },
    data: allowed,
    select: { id: true, name: true, email: true, phone: true, role: true, status: true }
  });
};

const getAllUsers = async (societyId, filters = {}) => {
  const where = { societyId };
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;

  return await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, status: true, createdAt: true,
      flat: { select: { number: true, floor: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getUserById = async (societyId, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, status: true, createdAt: true,
      flat: { select: { id: true, number: true, floor: true } },
      society: { select: { id: true, name: true } }
    }
  });
  if (!user || user.society?.id !== societyId) throw new Error('User not found');
  return user;
};

const getPendingUsers = async (societyId) => {
  return await prisma.user.findMany({
    where: { societyId, status: 'PENDING' },
    select: { id: true, name: true, email: true, role: true, createdAt: true, flat: { select: { number: true } } }
  });
};

const approveUser = async (userId, societyId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.societyId !== societyId) throw new Error('User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED' }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'ACCOUNT_APPROVED',
      title: 'Account Approved',
      body: 'Your account has been approved. You can now access all features.',
    }
  });

  return updated;
};

const rejectUser = async (userId, societyId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.societyId !== societyId) throw new Error('User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'REJECTED' }
  });

  await prisma.notification.create({
    data: {
      userId,
      type: 'ACCOUNT_REJECTED',
      title: 'Account Rejected',
      body: 'Your account registration has been rejected. Please contact your society admin.',
    }
  });

  return updated;
};

const getSocietyContacts = async (societyId) => {
  return await prisma.user.findMany({
    where: { societyId, status: 'APPROVED' },
    select: { id: true, name: true, phone: true, role: true, flat: { select: { number: true } } }
  });
};

const saveFcmToken = async (userId, token) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { fcmToken: token }
  });
};

const deleteUser = async (userId, societyId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.societyId !== societyId) throw new Error('User not found');
  
  // Clear any assigned complaints (return them to the OPEN pool)
  await prisma.complaint.updateMany({
    where: { assignedToId: userId },
    data: { assignedToId: null, status: 'OPEN' }
  });

  // Delete all notifications tied to the user
  await prisma.notification.deleteMany({
    where: { userId }
  });

  // Delete the user
  return await prisma.user.delete({ where: { id: userId } });
};

module.exports = {
  getProfile, updateProfile, updateUser, getAllUsers, getUserById,
  getPendingUsers, approveUser, rejectUser,
  getSocietyContacts, saveFcmToken, deleteUser
};