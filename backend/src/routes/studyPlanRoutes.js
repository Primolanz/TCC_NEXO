const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlanController');
const authMiddleware = require('../middlewares/auth');

// Rota para solicitar a geração do plano de estudos via IA
router.post('/generate', authMiddleware, studyPlanController.generatePlan);

module.exports = router;