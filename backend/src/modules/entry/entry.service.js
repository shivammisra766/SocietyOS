const prisma = require('../../shared/config/prisma');
const EntryLog = require('./entry.model');
const { sendPushNotification } = require('../../shared/config/pushNotification');

/**
 * Batch-resolve flat/guard/resident names from Postgres for Mongo entry docs.
 * Returns plain objects with the same shape the frontend expects.
 */
async function hydrateEntries(entries) {
  const docs = Array.isArray(entries) ? entries : [entries];
  if (docs.length === 0) return [];

  const flatIds = [...new Set(docs.map(e => e.flatId).filter(Boolean))];
  const guardIds = [...new Set(docs.map(e => e.guardId).filter(Boolean))];
  const residentIds = [...new Set(docs.map(e => e.residentId).filter(Boolean))];

  const [flats, guards, residents] = await Promise.all([
    flatIds.length ? prisma.flat.findMany({ where: { id: { in: flatIds } }, select: { id: true, number: true } }) : [],
    guardIds.length ? prisma.user.findMany({ where: { id: { in: guardIds } }, select: { id: true, name: true } }) : [],
    residentIds.length ? prisma.user.findMany({ where: { id: { in: residentIds } }, select: { id: true, name: true } }) : [],
  ]);

  const flatMap = Object.fromEntries(flats.map(f => [f.id, f]));
  const guardMap = Object.fromEntries(guards.map(g => [g.id, g]));
  const residentMap = Object.fromEntries(residents.map(r => [r.id, r]));

  return docs.map(e => {
    const obj = e.toJSON ? e.toJSON() : { ...e };
    obj.id = obj._id;
    obj.flat = flatMap[e.flatId] ? { number: flatMap[e.flatId].number } : null;
    obj.guard = guardMap[e.guardId] ? { name: guardMap[e.guardId].name } : null;
    obj.resident = residentMap[e.residentId] ? { name: residentMap[e.residentId].name } : null;
    obj.pass = null;
    return obj;
  });
}

const createEntryRequest = async ({ visitorName, visitorPhone, purpose, userId, visitorType, flatId, societyId }, io) => {
  // Find resident(s) for this flat
  const flat = await prisma.flat.findUnique({
    where: { id: flatId },
    include: { users: { where: { role: 'RESIDENT', status: 'APPROVED' } } }
  });
  if (!flat) throw new Error('Flat not found');

  const entry = await new EntryLog({
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
  }).save();

  // Hydrate for response
  const [hydrated] = await hydrateEntries(entry);

  // Create notifications for flat residents
  for (const resident of (flat?.users || [])) {
    await prisma.notification.create({
      data: {
        userId: resident.id,
        type: 'WALK_IN_REQUEST',
        title: 'Entry Request',
        body: `${visitorName} is at the gate requesting entry to your flat`,
        metadata: { entryId: hydrated.id }
      }
    });
  }

  if (io) {
    io.to(`society_${societyId}`).emit('entry:new', { entry: hydrated });
    flat?.users?.forEach(resident => {
      io.to(resident.id).emit('entry:new', {
        message: `${visitorName} is at the gate requesting entry`,
        entry: hydrated
      });
      // Send real push notification for background delivery
      void sendPushNotification(
        resident.id, 
        '🏠 Visitor at Gate', 
        `${visitorName} is at the gate requesting entry to your flat`,
        { entryId: hydrated.id, type: 'WALK_IN_REQUEST', visitorName }
      );
    });
  }

  return hydrated;
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

  const entry = await new EntryLog({
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
  }).save();

  const [hydrated] = await hydrateEntries(entry);

  if (io) {
    io.to(`society_${guardUser.societyId}`).emit('entry:new', { entry: hydrated });
  }

  return hydrated;
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

  const entry = await new EntryLog(data).save();
  const [hydrated] = await hydrateEntries(entry);

  if (io) {
    io.to(`society_${guardUser.societyId}`).emit('entry:new', { entry: hydrated });
  }
  return hydrated;
};

const logExit = async (entryId, guardUser, io) => {
  const entry = await EntryLog.findById(entryId);
  if (!entry) throw new Error('Entry not found');
  if (entry.societyId !== guardUser.societyId) throw new Error('Entry not in your society');

  entry.exitTime = new Date();
  await entry.save();

  const [hydrated] = await hydrateEntries(entry);

  if (io) {
    io.to(`society_${guardUser.societyId}`).emit('entry:updated', { entry: hydrated });
  }

  return hydrated;
};

const getMyEntries = async (user) => {
  const filter = { societyId: user.societyId };
  const limit = 100;

  if (user.role === 'RESIDENT') {
    filter.flatId = user.flatId;
    const docs = await EntryLog.find(filter).sort({ entryTime: -1 }).limit(50).lean();
    return hydrateEntries(docs);
  }

  const docs = await EntryLog.find(filter).sort({ entryTime: -1 }).limit(limit).lean();
  return hydrateEntries(docs);
};

const getTodayEntries = async (societyId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const docs = await EntryLog.find({
    societyId,
    entryTime: { $gte: start },
  }).sort({ entryTime: -1 }).lean();
  return hydrateEntries(docs);
};

const getFilteredEntries = async (societyId, filters = {}) => {
  const where = { societyId };

  if (filters.dateFrom) where.entryTime = { ...(where.entryTime || {}), $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.entryTime = { ...(where.entryTime || {}), $lte: new Date(filters.dateTo) };
  if (filters.visitorType) where.visitorType = filters.visitorType;
  if (filters.method) where.method = filters.method;
  if (filters.status) where.status = filters.status;
  if (filters.flatId) where.flatId = filters.flatId;

  const docs = await EntryLog.find(where)
    .sort({ entryTime: -1 })
    .limit(filters.limit ? parseInt(filters.limit) : 200)
    .lean();
  return hydrateEntries(docs);
};

const updateEntryStatus = async (id, status, io) => {
  const entry = await EntryLog.findByIdAndUpdate(id, { status }, { new: true });
  if (!entry) throw new Error('Entry not found');

  const [hydrated] = await hydrateEntries(entry);

  // Create notification for guard
  if (entry.guardId) {
    const statusText = status === 'APPROVED' ? 'approved' : 'denied';
    await prisma.notification.create({
      data: {
        userId: entry.guardId,
        type: `ENTRY_${status}`,
        title: `Entry ${statusText}`,
        body: `Entry for ${entry.visitorName} has been ${statusText}`,
        metadata: { entryId: entry._id }
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
    io.to(`society_${entry.societyId}`).emit('entry:updated', { entry: hydrated });
    if (entry.guardId) {
      io.to(entry.guardId).emit('entry:updated', { entry: hydrated });
      void sendPushNotification(
        entry.guardId, 
        `Entry ${status.toLowerCase()}`, 
        `Visitor ${entry.visitorName} was ${status.toLowerCase()}`,
        { entryId: entry._id, type: `ENTRY_${status}` }
      );
    }
    if (entry.residentId) {
      io.to(entry.residentId).emit('entry:updated', { entry: hydrated });
      // Don't push to resident if they just approved it (optional, but good for multi-user flats)
      void sendPushNotification(
        entry.residentId, 
        `✅ Entry ${status === 'APPROVED' ? 'Approved' : 'Denied'}`, 
        `Visitor ${entry.visitorName} was ${status.toLowerCase()}`,
        { entryId: entry._id, type: `ENTRY_${status}` }
      );
    }
  }
  return hydrated;
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