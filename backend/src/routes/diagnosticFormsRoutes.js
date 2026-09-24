const express = require('express');
const router = express.Router();
const diagnosticController = require('../controllers/diagnosticFormsController');
const authMiddleware = require('../middlewares/auth');

// Buscar questões para realizar a prova
router.get('/questions', authMiddleware, diagnosticController.getQuestions);

// Submeter respostas da prova
router.post('/submit', authMiddleware, diagnosticController.submitDiagnostic);

module.exports = router;