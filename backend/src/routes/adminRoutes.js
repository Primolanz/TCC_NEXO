const express = require('express');
const authMiddleware = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();
router.use(authMiddleware);
router.get('/overview', adminController.getOverview);
router.patch('/teachers/:id/approval', adminController.setTeacherApproval);

module.exports = router;
