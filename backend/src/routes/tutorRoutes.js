const express = require('express');
const authMiddleware = require('../middlewares/auth');
const tutorController = require('../controllers/tutorController');

const router = express.Router();
router.post('/tutor', authMiddleware, tutorController.chat);

module.exports = router;
