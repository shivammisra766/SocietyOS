const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const entryLogSchema = new mongoose.Schema({
  _id:          { type: String, default: uuidv4 },
  visitorName:  { type: String, required: true },
  visitorPhone: { type: String, default: null },
  visitorType:  { type: String, enum: ['DELIVERY', 'CAB', 'HOUSEHOLD_WORKER', 'GUEST', 'SERVICE_PROFESSIONAL'], required: true },
  method:       { type: String, enum: ['QR_SCAN', 'MANUAL_LOOKUP', 'LIVE_APPROVAL'], required: true },
  status:       { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SCANNED', 'EXPIRED'], required: true },
  notes:        { type: String, default: null },
  visitorIdUrl: { type: String, default: null },
  passId:       { type: String, default: null },
  guardId:      { type: String, required: true },
  residentId:   { type: String, default: null },
  flatId:       { type: String, required: true },
  societyId:    { type: String, required: true },
  entryTime:    { type: Date, default: Date.now },
  exitTime:     { type: Date, default: null },
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
});

// Indexes matching the original Prisma schema
entryLogSchema.index({ societyId: 1, entryTime: -1 });
entryLogSchema.index({ flatId: 1 });
entryLogSchema.index({ guardId: 1 });
entryLogSchema.index({ passId: 1 });

module.exports = mongoose.model('EntryLog', entryLogSchema);
