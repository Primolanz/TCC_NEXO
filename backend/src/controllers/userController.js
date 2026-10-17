const supabase = require('../config/supabase');

exports.registerUser = async (req, res) => {
  const { name, email, password, role = 'STUDENT' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    // Cadastra credenciais no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      const authErrorText = `${authError.code || ''} ${authError.message || ''}`;
      const emailAlreadyExists = /already[_ ]?(?:registered|exists)|user[_ ]already[_ ]exists|email[_ ]exists|email.*taken/i.test(authErrorText);
      return res.status(emailAlreadyExists ? 409 : 400).json({
        error: emailAlreadyExists ? 'E-mail já cadastrado. Tente entrar ou use outro e-mail.' : authError.message,
      });
    }

    const authUser = authData?.user;
    if (!authUser?.id || (Array.isArray(authUser.identities) && authUser.identities.length === 0)) {
      return res.status(409).json({ error: 'E-mail já cadastrado. Tente entrar ou use outro e-mail.' });
    }

    // Insere perfil na tabela pública 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.id,
          name,
          email,
          role,
          plan: 'FREE',
        }
      ])
      .select();

    if (userError) {
      console.error('[Cadastro] Falha ao criar perfil vinculado ao usuário Auth:', userError.message);
      return res.status(500).json({ error: 'A conta foi criada, mas não foi possível salvar o perfil. Entre em contato com o suporte.' });
    }

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: userData[0],
      session: authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      } : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
};




exports.refreshSession = async (req, res) => {
  const { refresh_token: refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token não fornecido.' });
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    return res.status(200).json({ session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    } });
  } catch {
    return res.status(500).json({ error: 'Não foi possível renovar a sessão.' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // 1. Autentica no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 2. Busca o perfil completo na tabela pública 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return res.status(400).json({ error: 'Erro ao buscar perfil do usuário.' });
    }

    const [{ data: diagnostic, error: diagnosticError }, { data: studyPlan, error: planError }] = await Promise.all([
      supabase.from('diagnostics').select('id').eq('user_id', authData.user.id).limit(1).maybeSingle(),
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
        hasStudyPlan,
        onboardingCompleted: hasProfile || hasDiagnostic || hasStudyPlan,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};

// Atualizar perfil do Onboarding (Idade, Ocupação e Objetivos)
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

exports.upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user.id;
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
