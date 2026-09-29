const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato do token inválido. Use "Bearer <TOKEN>".' });
  }

  const token = parts[1];

  try {
    // Instancia um cliente temporário com o token da requisição
    const supabaseUserClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Obtém o usuário associado a este token
    const { data: { user }, error } = await supabaseUserClient.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno ao validar autenticação.' });
  }
};