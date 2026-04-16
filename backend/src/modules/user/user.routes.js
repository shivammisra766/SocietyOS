const router = require('express').Router();
const controller = require('./user.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');
const { upload } = require('../../shared/config/cloudinary');

router.get('/me', authenticate, controller.getProfile);
router.post('/me/profile-picture', authenticate, upload.single('image'), controller.uploadProfilePicture);
router.patch('/me', authenticate, controller.updateProfile);
router.post('/fcm-token', authenticate, controller.saveFcmToken);
router.get('/contacts', authenticate, controller.getContacts);
router.get('/pending', authenticate, authorize('ADMIN'), controller.getPending);
router.get('/', authenticate, authorize('ADMIN'), controller.getAllUsers);
router.get('/:id', authenticate, authorize('ADMIN'), controller.getUserById);
router.patch('/:id', authenticate, authorize('ADMIN'), controller.updateUser);
router.patch('/:id/approve', authenticate, authorize('ADMIN'), controller.approve);
router.patch('/:id/reject', authenticate, authorize('ADMIN'), controller.reject);
router.delete('/:id', authenticate, authorize('ADMIN'), controller.deleteUser);

module.exports = router;