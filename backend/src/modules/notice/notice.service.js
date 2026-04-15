const prisma = require('../../shared/config/prisma');

const createNotice = async (user, data, io) => {
  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      body: data.body,
      category: data.category || 'GENERAL',
      priority: data.priority || 'NORMAL',
      isPinned: data.isPinned || false,
      authorId: user.id,
      societyId: user.societyId,
    },
    include: { author: { select: { name: true } } }
  });

  if (io && user.societyId) {
    io.to(`society_${user.societyId}`).emit('notice:new', notice);
  }
  
  return notice;
};

const getNotices = async (societyId) => {
  return await prisma.notice.findMany({
    where: { societyId },
    include: { author: { select: { name: true } } },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });
};

const updateNotice = async (user, id, data) => {
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || notice.societyId !== user.societyId) throw new Error('Notice not found');
  return await prisma.notice.update({ where: { id }, data });
};

const deleteNotice = async (user, id) => {
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || notice.societyId !== user.societyId) throw new Error('Notice not found');
  return await prisma.notice.delete({ where: { id } });
};

const togglePin = async (user, id) => {
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || notice.societyId !== user.societyId) throw new Error('Notice not found');
  return await prisma.notice.update({ where: { id }, data: { isPinned: !notice.isPinned } });
};

module.exports = { createNotice, getNotices, updateNotice, deleteNotice, togglePin };
