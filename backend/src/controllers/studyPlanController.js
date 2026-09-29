const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

// POST /api/study-plans/generate
exports.generatePlan = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Buscar informações do utilizador
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, main_goal, plan')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Trava de Segurança (Regra de Negócio)
    if (user.plan !== 'pro') {
      return res.status(403).json({
        error: 'Recurso exclusivo do Plano Pro.',
        message: 'Faça o upgrade para liberar planos de estudo gerados por IA.'
      });
    }

    const studentData = {
      name: user.name,
      main_goal: user.main_goal,
      portuguese_score: 65,
      math_score: 40,
      weakness_topics: ['Álgebra', 'Interpretação de Texto']
    };

    // 3. Gerar plano via Groq AI
    const generatedPlan = await aiService.generateStudyPlan(studentData);

    // 4. Persistir o plano gerado na tabela study_plans
    const { data: savedPlan, error: saveError } = await supabase
      .from('study_plans')
      .insert({
        user_id: userId,
        summary: generatedPlan.summary,
        weekly_focus: generatedPlan.weekly_focus,
        schedule: generatedPlan.schedule
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return res.status(201).json({
      message: 'Plano de estudos gerado e salvo com sucesso!',
      plan: savedPlan
    });

  } catch (error) {
    console.error('Erro na geração do plano:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/study-plans/me
exports.getMyPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    // Busca o plano de estudos mais recente do utilizador logado
    const { data: plan, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!plan) {
      return res.status(444).json({
        message: 'Nenhum plano de estudos encontrado para este utilizador.',
        plan: null
      });
    }

    return res.status(200).json({
      plan
    });

  } catch (error) {
    console.error('Erro ao buscar o plano de estudos:', error);
    return res.status(500).json({ error: error.message });
  }
};