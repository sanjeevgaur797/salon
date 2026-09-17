const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

router.use(authenticate);
router.use(checkSubscription);

router.get('/', authorize('SALON_OWNER', 'RECEPTIONIST', 'STAFF'), dashboardController.getDashboardStats);

module.exports = router;
