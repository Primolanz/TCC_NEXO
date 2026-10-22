const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabase');
const { friendlyAuthError, isEmailRateLimitError } = require('../utils/authErrors');

exports.requestReset = async (req, res) => {
  const email = String(req.body.email || '').trim();
  if (!email) return res.status(400).json({ error: 'Informe seu e-mail.' });

  try {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const redirectTo = `${frontendUrl}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error('[Senha] Supabase resetPasswordForEmail falhou:', error.message);
      return res.status(isEmailRateLimitError(error) ? 429 : 400).json({ error: friendlyAuthError(error, 'Não foi possível solicitar a redefinição.') });
    }
    return res.json({ message: 'E-mail com instruções para redefinir sua senha enviado com sucesso. Confira sua caixa de entrada.' });
  } catch (error) {
    console.error('[Senha] Erro ao solicitar redefinição:', error.message);
    return res.status(isEmailRateLimitError(error) ? 429 : 500).json({ error: friendlyAuthError(error, 'Não foi possível solicitar a redefinição agora.') });
  }
};

exports.updatePassword = async (req, res) => {
  const { password, current_password: currentPassword, refresh_token: refreshToken } = req.body;
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
  }
  if (!refreshToken) return res.status(400).json({ error: 'A sessão de redefinição expirou. Solicite um novo link.' });

  try {
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    if (typeof currentPassword === 'string' && currentPassword.length > 0) {
      const { data: signedIn, error: signInError } = await client.auth.signInWithPassword({ email: req.user.email, password: currentPassword });
      if (signInError || signedIn.user?.id !== req.user.id) return res.status(401).json({ error: 'A senha atual está incorreta.' });
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) return res.status(isEmailRateLimitError(updateError) ? 429 : 400).json({ error: friendlyAuthError(updateError, 'Não foi possível atualizar a senha.') });
      return res.json({ message: 'Senha atualizada com sucesso.' });
    }

    const accessToken = req.headers.authorization.slice('Bearer '.length).trim();
    const { error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionError) return res.status(401).json({ error: 'A sessão expirou. Solicite um novo link de redefinição.' });

    const { error } = await client.auth.updateUser({ password });
    if (error) return res.status(isEmailRateLimitError(error) ? 429 : 400).json({ error: friendlyAuthError(error, 'Não foi possível atualizar a senha.') });
    return res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    return res.status(isEmailRateLimitError(error) ? 429 : 500).json({ error: friendlyAuthError(error, 'Não foi possível atualizar a senha agora.') });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.body.refresh_token;
  const authorization = req.headers.authorization || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!accessToken || !refreshToken) return res.status(400).json({ error: 'Sessão inválida para sair da conta.' });

  try {
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const { error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionError) return res.status(401).json({ error: 'A sessão já expirou.' });
    const { error } = await client.auth.signOut({ scope: 'global' });
    if (error) return res.status(400).json({ error: error.message || 'Não foi possível encerrar a sessão.' });
    return res.json({ message: 'Sessão encerrada com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Não foi possível encerrar a sessão agora.' });
  }
};
