const service = require('./user.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await service.getProfile(req.user.id);
  res.json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await service.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: user });
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  // req.file.path contains the secure Cloudinary URL when using multer-storage-cloudinary
  const user = await service.updateProfile(req.user.id, {
    profilePicture: req.file.path
  });

  res.json({ success: true, data: user, profilePicture: req.file.path });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await service.updateUser(req.params.id, req.user.societyId, req.body);
  res.json({ success: true, data: user });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await service.getAllUsers(req.user.societyId, req.query);
  res.json({ success: true, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await service.getUserById(req.user.societyId, req.params.id);
  res.json({ success: true, data: user });
});

const getPending = asyncHandler(async (req, res) => {
  const users = await service.getPendingUsers(req.user.societyId);
  res.json({ success: true, data: users });
});

const approve = asyncHandler(async (req, res) => {
  const user = await service.approveUser(req.params.id, req.user.societyId);
  res.json({ success: true, data: user });
});

const reject = asyncHandler(async (req, res) => {
  const user = await service.rejectUser(req.params.id, req.user.societyId);
  res.json({ success: true, data: user });
});

const getContacts = asyncHandler(async (req, res) => {
  const contacts = await service.getSocietyContacts(req.user.societyId);
  res.json({ success: true, data: contacts });
});

const saveFcmToken = asyncHandler(async (req, res) => {
  await service.saveFcmToken(req.user.id, req.body.token);
  res.json({ success: true, message: 'FCM token saved' });
});

const deleteUser = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id, req.user.societyId);
  res.json({ success: true, message: 'User deleted' });
});

module.exports = {
  getProfile, updateProfile, uploadProfilePicture, updateUser, getAllUsers, getUserById,
  getPending, approve, reject, getContacts, saveFcmToken, deleteUser
};