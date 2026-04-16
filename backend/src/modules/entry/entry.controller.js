const entryService = require('./entry.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

const createEntryRequest = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const entry = await entryService.createEntryRequest({
    ...req.body,
    userId: req.user.id,
    societyId: req.user.societyId
  }, io);
  res.status(201).json({ success: true, data: entry });
});

const scanEntry = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const entry = await entryService.createScanEntry(req.user, req.body.passId, io);
  res.status(201).json({ success: true, data: entry });
});

const manualEntry = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const entry = await entryService.createManualEntry(req.user, req.body, io);
  res.status(201).json({ success: true, data: entry });
});

const logExit = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const entry = await entryService.logExit(req.params.id, req.user, io);
  res.json({ success: true, data: entry });
});

const getMyEntries = asyncHandler(async (req, res) => {
  const entries = await entryService.getMyEntries(req.user);
  res.json({ success: true, data: entries });
});

const getTodayEntries = asyncHandler(async (req, res) => {
  const entries = await entryService.getTodayEntries(req.user.societyId);
  res.json({ success: true, data: entries });
});

const getFilteredEntries = asyncHandler(async (req, res) => {
  const entries = await entryService.getFilteredEntries(req.user.societyId, req.query);
  res.json({ success: true, data: entries });
});

const approveEntry = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const entry = await entryService.updateEntryStatus(req.params.id, 'APPROVED', io);
  res.json({ success: true, data: entry });
});

const denyEntry = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const entry = await entryService.updateEntryStatus(req.params.id, 'REJECTED', io);
  res.json({ success: true, data: entry });
});

module.exports = {
  createEntryRequest, scanEntry, manualEntry, logExit,
  getMyEntries, getTodayEntries, getFilteredEntries,
  approveEntry, denyEntry
};