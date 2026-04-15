const express = require('express');
const router = express.Router();
const controller = require('./entry.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');

router.post('/walkin', authenticate, authorize('SECURITY'), controller.createEntryRequest);
router.post('/scan', authenticate, authorize('SECURITY'), controller.scanEntry);
router.post('/manual', authenticate, authorize('SECURITY'), controller.manualEntry);
router.patch('/:id/exit', authenticate, authorize('SECURITY', 'ADMIN'), controller.logExit);
router.get('/today', authenticate, authorize('SECURITY', 'ADMIN'), controller.getTodayEntries);
router.get('/my-flat', authenticate, authorize('RESIDENT'), controller.getMyEntries);
router.get('/', authenticate, authorize('ADMIN'), controller.getFilteredEntries);
router.patch('/:id/approve', authenticate, authorize('RESIDENT'), controller.approveEntry);
router.patch('/:id/deny', authenticate, authorize('RESIDENT'), controller.denyEntry);

module.exports = router;
