const express = require('express');
const router = express.Router();
const salonController = require('../controllers/salonController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

router.use(authenticate);

// Super Admin endpoints
router.get('/', authorize('SUPER_ADMIN'), salonController.getSalons);
router.post('/', authorize('SUPER_ADMIN'), salonController.createSalon);
router.post('/:salonId/assign-plan', authorize('SUPER_ADMIN'), salonController.assignOrRenewPlan);

// Subscription status check (accessible even if expired so owner can see details)
router.get('/subscription-status', authorize('SALON_OWNER', 'RECEPTIONIST', 'STAFF'), salonController.getSubscriptionStatus);

// Salon config (gated by subscription and owner role)
router.put('/config', authorize('SALON_OWNER'), checkSubscription, salonController.updateSalonConfig);

module.exports = router;
