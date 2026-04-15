const router = require('express').Router();
const controller = require('./complaint.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');

router.post('/', authenticate, authorize('RESIDENT'), controller.create);
router.get('/mine', authenticate, authorize('RESIDENT', 'SERVICE'), controller.getMyComplaints);
router.get('/', authenticate, authorize('ADMIN'), controller.getAll);
router.patch('/:id/close', authenticate, authorize('ADMIN'), controller.close);
router.patch('/:id/assign', authenticate, authorize('ADMIN'), controller.assign);
router.patch('/:id/status', authenticate, authorize('SERVICE'), controller.updateStatus);

module.exports = router;