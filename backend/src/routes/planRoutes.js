const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(authenticate);

router.post('/', authorize('SUPER_ADMIN'), planController.createPlan);
router.get('/', planController.getPlans);
router.put('/:id', authorize('SUPER_ADMIN'), planController.updatePlan);

module.exports = router;
