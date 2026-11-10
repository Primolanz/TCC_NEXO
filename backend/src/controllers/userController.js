const supabase = require('../config/supabase');
const { friendlyAuthError, isEmailRateLimitError } = require('../utils/authErrors');

exports.registerUser = async (req, res) => {
  const { name, email, password, role = 'STUDENT' } = req.body;
  const normalizedRole = String(role).toUpperCase();

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha sÃ£o obrigatÃ³rios.' });
  }

  try {
    // Cadastra credenciais no Supabase Auth
    let authData;
    let authError;
    try {
      ({ data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: normalizedRole } },
      }));
    } catch (error) {
      console.error('[Cadastro] Supabase Auth indispon?vel:', error.message);
      return res.status(502).json({ error: 'N?o foi poss?vel criar a conta no servi?o de autentica??o. Tente novamente.' });
    }

    if (authError) {
      const authErrorText = `${authError.code || ''} ${authError.message || ''}`;
      const emailAlreadyExists = /already[_ ]?(?:registered|exists)|user[_ ]already[_ ]exists|email[_ ]exists|email.*taken/i.test(authErrorText);
      return res.status(emailAlreadyExists ? 409 : 400).json({
        error: emailAlreadyExists ? 'E-mail jÃ¡ cadastrado. Tente entrar ou use outro e-mail.' : authError.message,
      });
    }

    const authUser = authData?.user;
    if (!authUser?.id || (Array.isArray(authUser.identities) && authUser.identities.length === 0)) {
      return res.status(409).json({ error: 'E-mail jÃ¡ cadastrado. Tente entrar ou use outro e-mail.' });
    }

    // Insere perfil na tabela pÃºblica 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.id,
          name,
          email,
          role: normalizedRole,
          ...(normalizedRole === 'TEACHER' ? { status_approval: 'PENDING' } : {}),
          plan: 'FREE',
        }
      ])
      .select();

    if (userError) {
      console.error('[Cadastro] Falha ao criar perfil vinculado ao usuÃ¡rio Auth:', userError.message);
      const duplicateKey = userError.code === '23505';
      return res.status(duplicateKey ? 409 : 500).json({
        error: duplicateKey ? 'Já existe um perfil com um dos dados informados. Confira seu e-mail e tente novamente.' : 'A conta foi criada, mas não foi possível salvar o perfil. Tente novamente ou entre em contato com o suporte.',
        code: userError.code || 'PROFILE_INSERT_FAILED',
      });
    }

    return res.status(201).json({
      // Preserve Supabase Auth's user/session response for the OTP flow.
      auth: authData,
      message: normalizedRole === 'TEACHER'
        ? 'Conta criada com sucesso. Seu cadastro de professor estÃ¡ pendente de aprovaÃ§Ã£o pelo administrador.'
        : 'UsuÃ¡rio cadastrado com sucesso!',
      user: userData[0],
      session: normalizedRole !== 'TEACHER' && authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      } : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuÃ¡rio.' });
  }
};




exports.refreshSession = async (req, res) => {
  const { refresh_token: refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token nÃ£o fornecido.' });
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return res.status(401).json({ error: 'SessÃ£o expirada. FaÃ§a login novamente.' });
    return res.status(200).json({ session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    } });
  } catch {
    return res.status(500).json({ error: 'NÃ£o foi possÃ­vel renovar a sessÃ£o.' });
  }
};

exports.loginUser = async (req, res) => {
  const requestedEmail = String(req.body?.email || '').trim().toLowerCase();
  const requestedRole = req.body?.role ?? req.body?.type ?? req.body?.tipo ?? null;
  console.log('Dados recebidos no login:', { email: requestedEmail, role: requestedRole });

  try {
    const { password } = req.body || {};
    const email = requestedEmail;
    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha sÃ£o obrigatÃ³rios.' });
    }

    let matchingProfileFound = null;
    if (process.env.NODE_ENV !== 'production') {
      const { data: matchingProfile, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email)
        .maybeSingle();
      if (lookupError) {
        console.error('[Login][dev] Erro exato na consulta case-insensitive de usuÃ¡rio:', lookupError);
      } else {
        matchingProfileFound = Boolean(matchingProfile);
        if (!matchingProfileFound) {
          console.log('Utilizador nÃ£o encontrado no Supabase:', email);
        }
      }
    }

    // 1. Autentica no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (isEmailRateLimitError(authError)) return res.status(429).json({ error: friendlyAuthError(authError) });
      if (matchingProfileFound) console.log('Senha incorreta para:', email);
      if (process.env.NODE_ENV !== 'production') console.error('[Login][dev] Erro exato retornado pelo Supabase Auth:', authError);
      const authCode = String(authError.code || authError.error_code || '').toLowerCase();
      if (authCode === 'email_not_confirmed') {
        return res.status(403).json({ error: 'Seu e-mail ainda não foi confirmado.', code: authCode });
      }
      if (authCode === 'user_not_found' || authCode === 'email_not_found') {
        return res.status(404).json({ error: 'E-mail ainda não cadastrado.', code: authCode });
      }
      return res.status(400).json({ message: 'Credenciais inválidas.', code: authCode });
    }

    // 2. Busca o perfil completo na tabela pÃºblica 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('Utilizador nÃ£o encontrado no Supabase:', email);
        return res.status(404).json({ message: 'Perfil de usuÃ¡rio nÃ£o encontrado.' });
      }
      console.error('[Login] Falha ao consultar o perfil pÃºblico apÃ³s autenticaÃ§Ã£o:', {
        email: requestedEmail,
        code: userError.code,
        message: userError.message,
      });
      throw userError;
    }

    if (!userData) {
      console.error('[Login] UsuÃ¡rio autenticado sem perfil correspondente na tabela users:', { email: requestedEmail });
      return res.status(404).json({ message: 'Perfil de usuÃ¡rio nÃ£o encontrado.' });
    }

    if (userData.role === 'TEACHER' && userData.status_approval !== 'APPROVED') {
      const rejected = userData.status_approval === 'REJECTED';
      return res.status(403).json({
        error: rejected
          ? 'O acesso Ã  sua conta de professor foi recusado pelo administrador.'
          : 'Sua conta de professor ainda estÃ¡ em anÃ¡lise pelo administrador.',
        code: rejected ? 'TEACHER_REJECTED' : 'TEACHER_PENDING',
      });
    }

    const [{ data: diagnostic, error: diagnosticError }, { data: studyPlan, error: planError }] = await Promise.all([
      supabase.from('diagnostics').select('id').eq('user_id', authData.user.id).eq('module', 'INITIAL').limit(1).maybeSingle(),
      supabase.from('study_plans').select('id').eq('user_id', authData.user.id).limit(1).maybeSingle(),
    ]);
    if (diagnosticError) throw diagnosticError;
    if (planError) throw planError;

    const hasProfile = Boolean(userData.age_group && userData.occupation && userData.main_goal);
    const hasDiagnostic = Boolean(diagnostic);
    const hasStudyPlan = Boolean(studyPlan);

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
      user: {
        ...userData,
        hasDiagnostic,
        hasInitialDiagnostic: hasDiagnostic,
        hasStudyPlan,
        hasProfile,
        onboardingCompleted: hasProfile && hasDiagnostic,
      },
    });
  } catch (error) {
    console.error('[Login] Erro interno durante autenticaÃ§Ã£o:', error.message);
    if (res.headersSent) return;
    return res.status(500).json({ message: 'Erro interno no servidor ao realizar login.' });
  }
};

exports.login = exports.loginUser;

exports.verifyEmailOtp = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otpCode = String(req.body?.otpCode || req.body?.token || '').trim();
  if (!email || !/^\d{6,8}$/.test(otpCode)) {
    return res.status(400).json({ message: 'Informe o e-mail e um código válido de até 8 dígitos.' });
  }
  try {
    let { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
    if (error && /invalid/i.test(error.message || '')) {
      const secondaryAttempt = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
      data = secondaryAttempt.data;
      error = secondaryAttempt.error;
    }
    if (error) {
      const limited = /rate.?limit|too many requests/i.test(`${error.code || ''} ${error.message || ''}`);
      if (limited) return res.status(429).json({ message: error.message, code: error.code });
      return res.status(400).json({ message: 'Código inválido ou expirado. Verifique o código recebido por e-mail.', code: error.code });
    }
    return res.status(200).json({ message: 'E-mail verificado com sucesso!', data });
  } catch {
    return res.status(500).json({ message: 'Não foi possível confirmar o e-mail.' });
  }
};

exports.resendSignupOtp = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Informe seu e-mail.' });
  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      const limited = /rate.?limit|too many requests/i.test(`${error.code || ''} ${error.message || ''}`);
      return res.status(limited ? 429 : 400).json({ error: error.message, code: error.code });
    }
    return res.status(200).json({ sent: true });
  } catch {
    return res.status(500).json({ error: 'Não foi possível reenviar o código.' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const [{ data: user, error: userError }, { data: diagnostic, error: diagnosticError }] = await Promise.all([
      supabase.from('users').select('*').eq('id', req.user.id).maybeSingle(),
      supabase.from('diagnostics').select('id').eq('user_id', req.user.id).eq('module', 'INITIAL').limit(1).maybeSingle(),
    ]);
    if (userError) throw userError;
    if (diagnosticError) throw diagnosticError;
    if (!user) return res.status(404).json({ error: 'Perfil de usuÃ¡rio nÃ£o encontrado.' });
    const hasProfile = Boolean(user.age_group && user.occupation && user.main_goal);
    const hasInitialDiagnostic = Boolean(diagnostic);
    return res.json({ user: {
      ...user,
      hasProfile,
      hasDiagnostic: hasInitialDiagnostic,
      hasInitialDiagnostic,
      onboardingCompleted: hasProfile && hasInitialDiagnostic,
    } });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao buscar perfil.' });
  }
};

// Atualizar perfil do Onboarding (Idade, OcupaÃ§Ã£o e Objetivos)
exports.updateOnboarding = async (req, res) => {
  try {
    const userId = req.user.id; // Obtido do authMiddleware
    const { age_group, occupation, main_goal } = req.body;

    if (!age_group || !occupation || !main_goal) {
      return res.status(400).json({ error: 'Preencha todos os campos do onboarding.' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        age_group,
        occupation,
        main_goal,
        updated_at: new Date()
      })
      .eq('id', userId)
      .select('id, name, email, role, plan, age_group, occupation, main_goal')
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: 'Dados do onboarding salvos com sucesso!',
      user: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.subscribePremium = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('users').select('id, role').eq('id', userId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return res.status(404).json({ error: 'Perfil de usuÃ¡rio nÃ£o encontrado.' });
    if (profile.role !== 'STUDENT') return res.status(403).json({ error: 'Apenas alunos podem assinar o plano Premium.' });

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({ plan: 'PREMIUM', updated_at: new Date() })
      .eq('id', userId)
      .select('id, name, email, role, plan')
      .single();

    if (updateError) throw updateError;

    const { data: diagnostic, error: diagnosticError } = await supabase
      .from('diagnostics')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (diagnosticError) throw diagnosticError;

    return res.status(200).json({
      message: 'Plano atualizado para PREMIUM com sucesso.',
      user,
      hasDiagnostic: Boolean(diagnostic),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.upgradeToPremium = exports.subscribePremium;
