const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

exports.generatePlan = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Buscar informações do usuário e plano
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, main_goal, plan')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Trava de Segurança (Regra de Negócio): Apenas plano 'pro' utiliza a IA
    // Se quiser testar durante o desenvolvimento sem restrição, pode comentar a condição abaixo temporariamente:
    /*
    if (user.plan !== 'pro') {
      return res.status(403).json({
        error: 'Recurso exclusivo do Plano Pro.',
        message: 'Faça o upgrade para liberar planos de estudo gerados por Inteligência Artificial.'
      });
    }
    */

    // 3. Montar objeto com dados fictícios/simulados do diagnóstico do aluno para a IA analisar
    const studentData = {
      name: user.name,
      main_goal: user.main_goal || 'Melhorar notas e desempenho em provas',
      portuguese_score: 78,
      math_score: 64,
      weakness_topics: ['Equações do 2º Grau', 'Interpretação de Texto', 'Porcentagem']
    };

    // 4. Chamar o serviço do Gemini
    const generatedPlan = await aiService.generateStudyPlan(studentData);

    return res.status(200).json({
      message: 'Plano de estudos gerado com sucesso pela IA!',
      plan: generatedPlan
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};