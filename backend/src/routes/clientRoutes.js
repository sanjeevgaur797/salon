const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

router.use(authenticate);
router.use(checkSubscription);

router.post('/', authorize('SALON_OWNER', 'RECEPTIONIST'), clientController.createClient);
router.get('/', authorize('SALON_OWNER', 'RECEPTIONIST', 'STAFF'), clientController.getClients);

module.exports = router;
