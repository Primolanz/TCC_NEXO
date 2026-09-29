const supabase = require('../config/supabase');

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Buscar dados do usuário (Nome, Objetivo e campos do perfil)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, main_goal')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Tenta buscar respostas do aluno se a tabela de respostas existir e estiver populada
    let answers = [];
    const { data: diagnosticData } = await supabase
      .from('diagnostic_answers')
      .select('*')
      .limit(100);

    if (diagnosticData) {
      answers = diagnosticData;
    }

    // 3. Estrutura os dados para preencher a tela da Dashboard
    return res.status(200).json({
      user: {
        name: user.name,
        main_goal: user.main_goal || 'Melhorar minhas notas, criar uma rotina de estudos e me preparar para provas.',
        objective_progress: 75
      },
      subjects: {
        portuguese: {
          score: 78,
          status: 'Bom!',
          feedback: 'Você demonstra um bom domínio da Língua Portuguesa! Continue praticando interpretação e gramática.',
          strengths: ['Interpretação de texto', 'Gramática', 'Ortografia']
        },
        math: {
          score: 64,
          status: 'Regular!',
          feedback: 'Você está no caminho certo! Foque em praticar resolução de problemas e raciocínio lógico.',
          strengths: ['Operações Básicas', 'Porcentagem', 'Geometria']
        }
      },
      overall_average: 71,
      evolution: [
        { label: 'Início', score: 0 },
        { label: 'Formulário', score: 40 },
        { label: 'Resultado', score: 68 },
        { label: 'Atual', score: 71 }
      ]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};