const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const passwordController = require('../controllers/passwordController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/refresh', userController.refreshSession);
router.post('/password/recovery', passwordController.requestReset);
router.put('/password', authMiddleware, passwordController.updatePassword);
router.post('/logout', authMiddleware, passwordController.logout);

router.put('/onboarding', authMiddleware, userController.updateOnboarding);
router.post('/subscribe-premium', authMiddleware, userController.subscribePremium);
router.post('/upgrade', authMiddleware, userController.upgradeToPremium);

// Rota protegida: retorna os dados do usuário autenticado
router.get('/me', authMiddleware, userController.getMyProfile);

module.exports = router;
