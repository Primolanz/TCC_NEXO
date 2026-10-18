const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabase');

exports.requestReset = async (req, res) => {
  const email = String(req.body.email || '').trim();
  if (!email) return res.status(400).json({ error: 'Informe seu e-mail.' });

  try {
    const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/redefinir-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error('[Senha] Supabase resetPasswordForEmail falhou:', error.message);
      return res.status(400).json({ error: error.message });
    }
    return res.json({ message: 'E-mail com instruções para redefinir sua senha enviado com sucesso. Confira sua caixa de entrada.' });
  } catch (error) {
    console.error('[Senha] Erro ao solicitar redefinição:', error.message);
    return res.status(500).json({ error: error.message || 'Não foi possível solicitar a redefinição agora.' });
  }
};

exports.updatePassword = async (req, res) => {
  const { password, refresh_token: refreshToken } = req.body;
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
  }
  if (!refreshToken) return res.status(400).json({ error: 'A sessão de redefinição expirou. Solicite um novo link.' });

  try {
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const accessToken = req.headers.authorization.slice('Bearer '.length).trim();
    const { error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionError) return res.status(401).json({ error: 'A sessão expirou. Solicite um novo link de redefinição.' });

    const { error } = await client.auth.updateUser({ password });
    if (error) return res.status(400).json({ error: error.message || 'Não foi possível atualizar a senha.' });
    return res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Não foi possível atualizar a senha agora.' });
  }
};
