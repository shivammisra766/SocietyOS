const prisma = require('../../shared/config/prisma');

const createEntryRequest = async ({ visitorName, visitorPhone, purpose, userId, visitorType, flatId, societyId }, io) => {
  // Find resident(s) for this flat
  const flat = await prisma.flat.findUnique({
    where: { id: flatId },
    include: { users: { where: { role: 'RESIDENT', status: 'APPROVED' } } }
  });
  if (!flat) throw new Error('Flat not found');

  const entry = await prisma.entryLog.create({
    data: {
      visitorName,
      visitorPhone,
      visitorType: visitorType || 'GUEST',
      method: 'LIVE_APPROVAL',
      status: 'PENDING',
      notes: purpose,
      guardId: userId,
      residentId: flat.users[0]?.id || null,
      flatId,
      societyId,
    },
    include: { flat: { select: { number: true } } }
  });

  // Create notifications for flat residents
  for (const resident of (flat?.users || [])) {
    await prisma.notification.create({
      data: {
        userId: resident.id,
        type: 'WALK_IN_REQUEST',
        title: 'Entry Request',
        body: `${visitorName} is at the gate requesting entry to your flat`,
        metadata: { entryId: entry.id }
      }
    });
  }

  if (io) {
    flat?.users?.forEach(resident => {
      io.to(resident.id).emit('entry:new', {
        message: `${visitorName} is at the gate requesting entry`,
        entry
      });
    });
  }

  return entry;
};

const createScanEntry = async (guardUser, passId) => {
  const pass = await prisma.pass.findUnique({
    where: { id: passId },
    include: { flat: { select: { number: true } } }
  });
  if (!pass) throw new Error('Pass not found');
  if (pass.societyId !== guardUser.societyId) throw new Error('Pass not in your society');

  // Mark one-time pass as USED
  if (pass.type === 'ONE_TIME' && pass.status === 'ACTIVE') {
    await prisma.pass.update({ where: { id: passId }, data: { status: 'USED' } });
  }

  const entry = await prisma.entryLog.create({
    data: {
      visitorName: pass.visitorName,
      visitorPhone: pass.visitorPhone,
      visitorType: pass.visitorType,
      method: 'QR_SCAN',
      status: 'SCANNED',
      guardId: guardUser.id,
      residentId: pass.residentId,
      passId: pass.id,
      flatId: pass.flatId,
      societyId: guardUser.societyId,
    }
  });

  return entry;
};

const createManualEntry = async (guardUser, { passId, visitorName, visitorType, flatId, notes }) => {
  const data = {
    visitorName,
    visitorType: visitorType || 'HOUSEHOLD_WORKER',
    method: 'MANUAL_LOOKUP',
    status: 'APPROVED',
    notes,
    guardId: guardUser.id,
    flatId,
    societyId: guardUser.societyId,
  };

  if (passId) {
    const pass = await prisma.pass.findUnique({ where: { id: passId } });
    if (pass) {
      data.passId = pass.id;
      data.visitorName = pass.visitorName;
      data.visitorType = pass.visitorType;
      data.residentId = pass.residentId;
    }
  }

  return await prisma.entryLog.create({ data });
};

const logExit = async (entryId, guardUser) => {
  const entry = await prisma.entryLog.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error('Entry not found');
  if (entry.societyId !== guardUser.societyId) throw new Error('Entry not in your society');

  return await prisma.entryLog.update({
    where: { id: entryId },
    data: { exitTime: new Date() }
  });
};

const getMyEntries = async (user) => {
  if (user.role === 'RESIDENT') {
    return await prisma.entryLog.findMany({
      where: { flatId: user.flatId, societyId: user.societyId },
      include: { flat: { select: { number: true } } },
      orderBy: { entryTime: 'desc' },
      take: 50,
    });
  }
  return await prisma.entryLog.findMany({
    where: { societyId: user.societyId },
    include: { flat: { select: { number: true } } },
    orderBy: { entryTime: 'desc' },
    take: 100,
  });
};

const getTodayEntries = async (societyId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return await prisma.entryLog.findMany({
    where: { societyId, entryTime: { gte: start } },
    include: { flat: { select: { number: true } } },
    orderBy: { entryTime: 'desc' },
  });
};

const getFilteredEntries = async (societyId, filters = {}) => {
  const where = { societyId };

  if (filters.dateFrom) where.entryTime = { ...(where.entryTime || {}), gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.entryTime = { ...(where.entryTime || {}), lte: new Date(filters.dateTo) };
  if (filters.visitorType) where.visitorType = filters.visitorType;
  if (filters.method) where.method = filters.method;
  if (filters.status) where.status = filters.status;
  if (filters.flatId) where.flatId = filters.flatId;

  return await prisma.entryLog.findMany({
    where,
    include: {
      flat: { select: { number: true } },
      guard: { select: { name: true } },
      resident: { select: { name: true } }
    },
    orderBy: { entryTime: 'desc' },
    take: filters.limit ? parseInt(filters.limit) : 200,
  });
};

const updateEntryStatus = async (id, status, io) => {
  const entry = await prisma.entryLog.update({
    where: { id },
    data: { status },
    include: { flat: { select: { number: true } } }
  });

  // Create notification for guard
  if (entry.guardId) {
    const statusText = status === 'APPROVED' ? 'approved' : 'denied';
    await prisma.notification.create({
      data: {
        userId: entry.guardId,
        type: `ENTRY_${status}`,
        title: `Entry ${statusText}`,
        body: `Entry for ${entry.visitorName} has been ${statusText}`,
        metadata: { entryId: entry.id }
      }
    });
  }

  if (io && entry.guardId) {
    io.to(entry.guardId).emit('entry:updated', { entry });
  }
  return entry;
};

module.exports = {
  createEntryRequest,
  createScanEntry,
  createManualEntry,
  logExit,
  getMyEntries,
  getTodayEntries,
  getFilteredEntries,
  updateEntryStatus
};