const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

router.use(authenticate);
router.use(checkSubscription);

// Geo-fencing check-in
router.post('/check-in', authorize('SALON_OWNER', 'RECEPTIONIST', 'STAFF'), attendanceController.checkIn);
router.get('/status', authorize('SALON_OWNER', 'RECEPTIONIST', 'STAFF'), attendanceController.getTodayStatus);
router.get('/', authorize('SALON_OWNER', 'RECEPTIONIST'), attendanceController.getAttendanceList);

module.exports = router;
