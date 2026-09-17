const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

router.use(authenticate);
router.use(checkSubscription);

// Receptionist & Owner can create appointments
router.post('/', authorize('SALON_OWNER', 'RECEPTIONIST'), appointmentController.createAppointment);

// Owner, Receptionist, and Staff can view appointments
router.get('/', authorize('SALON_OWNER', 'RECEPTIONIST', 'STAFF'), appointmentController.getAppointments);

// Update status
router.patch('/:id/status', authorize('SALON_OWNER', 'RECEPTIONIST', 'STAFF'), appointmentController.updateAppointmentStatus);

module.exports = router;
