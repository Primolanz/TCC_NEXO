const express = require('express');
const authMiddleware = require('../middlewares/auth');
const quizController = require('../controllers/quizController');

const router = express.Router();
router.get('/retake', authMiddleware, quizController.getRetake);
router.post('/retake/submit', authMiddleware, quizController.submitRetake);

module.exports = router;
