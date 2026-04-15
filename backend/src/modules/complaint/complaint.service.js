const prisma = require('../../shared/config/prisma');

const createComplaint = async ({ title, description, category, userId, flatId, societyId }) => {
  return await prisma.complaint.create({
    data: { title, description, category, userId, flatId, societyId, status: 'OPEN' }
  });
};

const getComplaints = async (filters = {}) => {
  return await prisma.complaint.findMany({
    where: filters,
    include: { 
      user: { select: { name: true, email: true } }, 
      flat: true,
      assignedTo: { select: { id: true, name: true, phone: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const closeComplaint = async (id, closingNote, io) => {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new Error('Complaint not found');

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: 'CLOSED', closingNote, updatedAt: new Date() }
  });

  if (io) {
    io.to(updated.userId).emit('complaint:closed', {
      message: `Your complaint "${updated.title}" has been closed`,
      complaint: updated
    });
  }

  return updated;
};

const assignComplaint = async (id, staffId, io) => {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new Error('Complaint not found');

  const updated = await prisma.complaint.update({
    where: { id },
    data: { 
      status: 'ASSIGNED', 
      assignedToId: staffId,
      updatedAt: new Date()
    },
    include: { assignedTo: { select: { name: true } } }
  });

  if (io) {
    io.to(updated.userId).emit('complaint:assigned', {
      message: `Your complaint "${updated.title}" has been assigned to ${updated.assignedTo.name}`,
    });
    // Optional: emit to the assigned service staff via socket or push
    io.to(staffId).emit('complaint:new_assignment', {
      message: `You have been assigned a new ticket: ${updated.title}`,
      complaint: updated
    });
  }

  return updated;
};

const updateComplaintStatus = async (id, status, staffId, io) => {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new Error('Complaint not found');
  if (complaint.assignedToId !== staffId) throw new Error('You are not assigned to this complaint');

  const validTransitions = ['IN_PROGRESS', 'RESOLVED'];
  if (!validTransitions.includes(status)) {
    throw new Error('Invalid status update from service staff');
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status, updatedAt: new Date() },
    include: { user: { select: { name: true } }, assignedTo: { select: { name: true } } }
  });

  if (io) {
    io.to(updated.userId).emit('complaint:status_update', {
      message: `Your complaint "${updated.title}" is now ${status.replace('_', ' ')}`,
      complaint: updated
    });
  }

  return updated;
};

module.exports = { createComplaint, getComplaints, closeComplaint, assignComplaint, updateComplaintStatus };