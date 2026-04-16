const prisma = require('../../shared/config/prisma');
const { sendPushNotification } = require('../../shared/config/pushNotification');

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
    io.to(`society_${societyId}`).emit('entry:new', { entry });
    flat?.users?.forEach(resident => {
      io.to(resident.id).emit('entry:new', {
        message: `${visitorName} is at the gate requesting entry`,
        entry
      });
      // Send real push notification for background delivery
      void sendPushNotification(
        resident.id, 
        '🏠 Visitor at Gate', 
        `${visitorName} is at the gate requesting entry to your flat`,
        { entryId: entry.id, type: 'WALK_IN_REQUEST', visitorName }
      );
    });
  }

  return entry;
};

const createScanEntry = async (guardUser, qrToken, io) => {
  const pass = await prisma.pass.findUnique({
    where: { qrToken },
    include: { flat: { select: { number: true } } }
  });
  if (!pass) throw new Error('Pass not found or invalid QR code');
  if (pass.societyId !== guardUser.societyId) throw new Error('Pass not in your society');
  if (pass.status !== 'ACTIVE') throw new Error(`Pass is already ${pass.status.toLowerCase()}`);
  if (pass.expiresAt && new Date(pass.expiresAt) < new Date()) {
    await prisma.pass.update({ where: { id: pass.id }, data: { status: 'EXPIRED' } });
    throw new Error('Pass has expired');
  }

  // Mark one-time pass as USED
  if (pass.type === 'ONE_TIME') {
    await prisma.pass.update({ where: { id: pass.id }, data: { status: 'USED' } });
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

  if (io) {
    io.to(`society_${guardUser.societyId}`).emit('entry:new', { entry });
  }

  return entry;
};

const createManualEntry = async (guardUser, { passId, visitorName, visitorType, flatId, notes }, io) => {
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

  const entry = await prisma.entryLog.create({ data });
  if (io) {
    io.to(`society_${guardUser.societyId}`).emit('entry:new', { entry });
  }
  return entry;
};

const logExit = async (entryId, guardUser, io) => {
  const entry = await prisma.entryLog.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error('Entry not found');
  if (entry.societyId !== guardUser.societyId) throw new Error('Entry not in your society');

  const updatedEntry = await prisma.entryLog.update({
    where: { id: entryId },
    data: { exitTime: new Date() }
  });

  if (io) {
    io.to(`society_${guardUser.societyId}`).emit('entry:updated', { entry: updatedEntry });
  }

  return updatedEntry;
};

const getMyEntries = async (user) => {
  if (user.role === 'RESIDENT') {
    return await prisma.entryLog.findMany({
      where: { flatId: user.flatId, societyId: user.societyId },
      include: { 
        flat: { select: { number: true } },
        guard: { select: { name: true } },
        resident: { select: { name: true } },
        pass: true
      },
      orderBy: { entryTime: 'desc' },
      take: 50,
    });
  }
  return await prisma.entryLog.findMany({
    where: { societyId: user.societyId },
    include: { 
      flat: { select: { number: true } },
      guard: { select: { name: true } },
      resident: { select: { name: true } },
      pass: true
    },
    orderBy: { entryTime: 'desc' },
    take: 100,
  });
};

const getTodayEntries = async (societyId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return await prisma.entryLog.findMany({
    where: { societyId, entryTime: { gte: start } },
    include: { 
      flat: { select: { number: true } },
      guard: { select: { name: true } },
      resident: { select: { name: true } },
      pass: true
    },
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
      resident: { select: { name: true } },
      pass: true
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

  // Update resident's WALK_IN_REQUEST notifications to reflect the finalized action
  const flat = await prisma.flat.findUnique({
    where: { id: entry.flatId },
    include: { users: { select: { id: true } } }
  });
  const flatUserIds = flat?.users.map(u => u.id) || [];

  if (flatUserIds.length > 0) {
    const pendingNotifs = await prisma.notification.findMany({
      where: { 
        type: 'WALK_IN_REQUEST',
        userId: { in: flatUserIds }
      }
    });
    
    const toUpdate = pendingNotifs.filter(n => n.metadata && typeof n.metadata === 'object' && n.metadata.entryId === id);
    
    for (const n of toUpdate) {
      await prisma.notification.update({
        where: { id: n.id },
        data: {
          type: `ENTRY_${status}`,
          title: `Entry ${status === 'APPROVED' ? 'Approved' : 'Denied'}`,
          body: `Entry for ${entry.visitorName} has been finalized.`,
          isRead: false // Reset unread so residents see the conclusion
        }
      });
    }
  }

  if (io) {
    io.to(`society_${entry.societyId}`).emit('entry:updated', { entry });
    if (entry.guardId) {
      io.to(entry.guardId).emit('entry:updated', { entry });
      void sendPushNotification(
        entry.guardId, 
        `Entry ${status.toLowerCase()}`, 
        `Visitor ${entry.visitorName} was ${status.toLowerCase()}`,
        { entryId: entry.id, type: `ENTRY_${status}` }
      );
    }
    if (entry.residentId) {
      io.to(entry.residentId).emit('entry:updated', { entry });
      // Don't push to resident if they just approved it (optional, but good for multi-user flats)
      void sendPushNotification(
        entry.residentId, 
        `✅ Entry ${status === 'APPROVED' ? 'Approved' : 'Denied'}`, 
        `Visitor ${entry.visitorName} was ${status.toLowerCase()}`,
        { entryId: entry.id, type: `ENTRY_${status}` }
      );
    }
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