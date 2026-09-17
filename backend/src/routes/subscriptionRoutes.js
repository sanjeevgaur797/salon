const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(authenticate);

router.get('/history', authorize('SUPER_ADMIN'), subscriptionController.getAllHistory);

module.exports = router;
