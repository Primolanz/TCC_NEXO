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

    // 2. Trava de Segurança (Regra de Negócio - Plano Premium/Pro)
    const userPlan = user.plan ? user.plan.toLowerCase() : '';
    if (userPlan !== 'pro' && userPlan !== 'premium') {
      return res.status(403).json({
        error: 'Recurso exclusivo do Plano Pro.',
        message: 'Faça o upgrade para liberar planos de estudo gerados por IA.'
      });
    }

    // 3. Buscar o diagnóstico mais recente do aluno
    const { data: diagnostic, error: diagError } = await supabase
      .from('diagnostics')
      .select('score, weak_topics')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (diagError) {
      console.warn('Aviso ao buscar diagnóstico:', diagError.message);
    }

    // 4. Extrair os nomes dos tópicos fracos do JSONB (ex: ["Coesao e Coerencia"])
    let parsedWeaknessTopics = ['Conceitos Gerais'];
    if (diagnostic?.weak_topics && Array.isArray(diagnostic.weak_topics)) {
      parsedWeaknessTopics = diagnostic.weak_topics
        .map(item => item.topic || item)
        .filter(Boolean);
    }

    // 5. Montar os dados dinâmicos para a IA
    const studentData = {
      name: user.name || 'Estudante',
      main_goal: user.main_goal || 'Aprovação em Exames',
      portuguese_score: diagnostic?.score ? diagnostic.score * 10 : 50,
      math_score: diagnostic?.score ? diagnostic.score * 10 : 50,
      weakness_topics: parsedWeaknessTopics
    };

    console.log('>>> Dados reais enviados para a IA:', studentData);

    // 6. Gerar plano via Groq AI
    const generatedPlan = await aiService.generateStudyPlan(studentData);

    // 7. Persistir o plano gerado na tabela study_plans
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
      return res.status(404).json({
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