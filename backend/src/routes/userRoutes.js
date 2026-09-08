const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const supabase = require('../config/supabase'); // Importante!

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Rota protegida: retorna os dados do usuário autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Perfil de usuário não encontrado.' });
    }

    return res.json({ user: userData });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

module.exports = router;