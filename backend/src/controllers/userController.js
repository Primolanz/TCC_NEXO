const supabase = require('../config/supabase');

exports.registerUser = async (req, res) => {
  const { name, email, password, role = 'STUDENT', plan = 'FREE' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    // Cadastra credenciais no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    // Insere perfil na tabela pública 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          role,
          plan
        }
      ])
      .select();

    if (userError) return res.status(400).json({ error: userError.message });

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: userData[0]
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
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

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
      user: userData,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};