  const supabase = require('../config/supabase');

  // 1. Buscar todas as questões (Sem revelar a resposta correta ao aluno)
  exports.getQuestions = async (req, res) => {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, subject, topic, statement, options');

      if (error) throw error;

      return res.status(200).json(questions);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };

  // 2. Submeter o teste, calcular pontuação e salvar diagnósticos
  exports.submitDiagnostic = async (req, res) => {
    try {
      const userId = req.user.id; // Obtido através do middleware de autenticação
      const { answers } = req.body; // Array de objetos: [{ question_id, selected_option }]

      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'Respostas não fornecidas.' });
      }

      // Buscar todas as questões para conferência do gabarito
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id, topic, correct_option');

      if (qError) throw qError;

      let score = 0;
      const weakTopicsMap = {};
      const answersToInsert = [];

      // Mapear respostas para facilitar a busca
      const questionMap = new Map(questions.map(q => [q.id, q]));

      for (const ans of answers) {
        const q = questionMap.get(ans.question_id);
        if (!q) continue;

        const isCorrect = q.correct_option === ans.selected_option;

        if (isCorrect) {
          score += 1;
        } else {
          // Registra contagem de erros por tópico
          weakTopicsMap[q.topic] = (weakTopicsMap[q.topic] || 0) + 1;
        }

        answersToInsert.push({
          question_id: ans.question_id,
          selected_option: ans.selected_option,
          is_correct: isCorrect
        });
      }

      // Formatar tópicos fracos para salvamento
      const weakTopics = Object.keys(weakTopicsMap).map(topic => ({
        topic,
        errorsCount: weakTopicsMap[topic]
      }));

      // Inserir registro na tabela 'diagnostics'
      const { data: diagnostic, error: dError } = await supabase
        .from('diagnostics')
        .insert({
          user_id: userId,
          score,
          weak_topics: weakTopics
        })
        .select()
        .single();

      if (dError) throw dError;

      // Inserir detalhamento das respostas associadas ao id do diagnóstico
      const finalAnswers = answersToInsert.map(a => ({
        ...a,
        diagnostic_id: diagnostic.id
      }));

      const { error: aError } = await supabase
        .from('diagnostic_answers')
        .insert(finalAnswers);

      if (aError) throw aError;

      return res.status(201).json({
        message: 'Diagnóstico concluído com sucesso!',
        diagnosticId: diagnostic.id,
        score,
        totalQuestions: questions.length,
        weakTopics
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };