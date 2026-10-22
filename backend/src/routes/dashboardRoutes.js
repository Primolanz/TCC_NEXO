const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, dashboardController.getDashboardData);

module.exports = router;