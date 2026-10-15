const supabase = require('../config/supabase');

function normalizeOption(value) {
  if (Number.isInteger(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (/^[0-4]$/.test(normalized)) return Number(normalized);
    if (/^[a-e]$/i.test(normalized)) return normalized.toLowerCase().charCodeAt(0) - 97;
  }
  return null;
}

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

exports.submitDiagnostic = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length !== 20) {
      return res.status(400).json({ error: 'A prova deve conter exatamente 20 respostas.' });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, subject, topic, statement, correct_option');
    if (questionsError) throw questionsError;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();
    if (userError) throw userError;

    const questionMap = new Map(questions.map((question) => [String(question.id), question]));
    let score = 0;
    const weakTopicsMap = {};
    const answersToInsert = [];
    const results = [];

    for (const answer of answers) {
      const question = questionMap.get(String(answer.question_id));
      if (!question) return res.status(400).json({ error: `Questão inválida: ${answer.question_id}` });

      const selectedOption = normalizeOption(answer.selected_option);
      const correctOption = normalizeOption(question.correct_option);
      if (selectedOption === null || correctOption === null) {
        return res.status(400).json({ error: 'Invalid option. Use an index from 0 to 4 or a letter from A to E.' });
      }
      const isCorrect = correctOption === selectedOption;
      if (isCorrect) score += 1;
      else weakTopicsMap[question.topic] = (weakTopicsMap[question.topic] || 0) + 1;

      answersToInsert.push({
        question_id: question.id,
        selected_option: selectedOption,
        is_correct: isCorrect,
      });
      results.push({
        question_id: question.id,
        subject: question.subject,
        topic: question.topic,
        statement: question.statement,
        selected_option: selectedOption,
        correct_option: correctOption,
        is_correct: isCorrect,
      });
    }

    const weakTopics = Object.entries(weakTopicsMap).map(([topic, errorsCount]) => ({ topic, errorsCount }));
    const { data: diagnostic, error: diagnosticError } = await supabase
      .from('diagnostics')
      .insert({ user_id: userId, score, weak_topics: weakTopics })
      .select()
      .single();
    if (diagnosticError) throw diagnosticError;

    const detailedAnswers = answersToInsert.map((answer) => ({ ...answer, diagnostic_id: diagnostic.id }));
    const { error: answersError } = await supabase.from('diagnostic_answers').insert(detailedAnswers);
    if (answersError) throw answersError;

    const canGenerateAIPlan = ['pro', 'premium'].includes(String(user.plan || '').toLowerCase());
    return res.status(200).json({
      message: 'Diagnóstico concluído com sucesso!',
      diagnosticId: diagnostic.id,
      score,
      totalQuestions: answersToInsert.length,
      correctAnswers: score,
      incorrectAnswers: answersToInsert.length - score,
      weakTopics,
      results,
      canGenerateAIPlan,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
