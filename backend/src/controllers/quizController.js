const supabase = require('../config/supabase');

const SUBJECTS = [
  { key: 'portuguese', matches: ['portugu', 'lingua', 'linguagem'], name: 'Português' },
  { key: 'math', matches: ['matema', 'math'], name: 'Matemática' },
];
const QUESTIONS_PER_SUBJECT = 10;

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function subjectFor(value = '') {
  const normalized = normalize(value);
  if (/(^|\s)lp($|\s)/.test(normalized)) return SUBJECTS[0];
  if (/(^|\s)mat($|\s)/.test(normalized)) return SUBJECTS[1];
  return SUBJECTS.find((subject) => subject.matches.some((match) => normalized.includes(match)));
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

async function ensureStudent(userId) {
  const { data, error } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data?.role === 'STUDENT';
}

exports.getRetake = async (req, res) => {
  try {
    if (!await ensureStudent(req.user.id)) return res.status(403).json({ error: 'Apenas alunos podem realizar o questionário.' });

    const [{ data: plans, error: planError }, { data: questionBank, error: questionsError }] = await Promise.all([
      supabase.from('study_plans').select('id').eq('user_id', req.user.id).order('created_at', { ascending: false }),
      supabase.from('questions').select('id, subject, topic, statement, options, module').eq('module', 'RETAKE').eq('is_initial', false),
    ]);
    if (planError) throw planError;
    if (questionsError) throw questionsError;

    let studied = [];
    const planIds = (plans || []).map((item) => item.id);
    if (planIds.length) {
      const { data, error } = await supabase.from('study_plan_progress')
        .select('topic, subject, completed_at')
        .eq('user_id', req.user.id).in('study_plan_id', planIds).not('completed_at', 'is', null);
      if (error) throw error;
      studied = (data || []).filter((item) => item.topic).map((item) => ({ topic: item.topic, subject: item.subject || '' }));
    }

    const selected = [];
    const selectedIds = new Set();
    const adaptedTopics = new Set();
    for (const subject of SUBJECTS) {
      const candidates = (questionBank || []).filter((question) => subjectFor(question.subject)?.key === subject.key);
      const studiedForSubject = studied.filter((item) => subjectFor(item.subject)?.key === subject.key);
      const matches = candidates.filter((question) => studiedForSubject.some((item) => {
        const questionTopic = normalize(question.topic);
        const studiedTopic = normalize(item.topic);
        return questionTopic === studiedTopic || questionTopic.includes(studiedTopic) || studiedTopic.includes(questionTopic);
      }));
      const adaptive = shuffle(matches).slice(0, QUESTIONS_PER_SUBJECT);
      adaptive.forEach((question) => {
        selected.push(question);
        selectedIds.add(String(question.id));
        adaptedTopics.add(question.topic);
      });
      const remaining = QUESTIONS_PER_SUBJECT - adaptive.length;
      const general = shuffle(candidates.filter((question) => !selectedIds.has(String(question.id)))).slice(0, remaining);
      general.forEach((question) => {
        selected.push(question);
        selectedIds.add(String(question.id));
      });
    }

    if (selected.length !== QUESTIONS_PER_SUBJECT * SUBJECTS.length) {
      return res.status(503).json({ error: 'O banco de questões inéditas ainda não tem questões suficientes de Português e Matemática.' });
    }
    return res.json({
      questions: shuffle(selected).map(({ id, subject, topic, statement, options }) => ({ id, subject, topic, statement, options })),
      adaptive_topics: [...adaptedTopics],
      studied_topics: [...new Set(studied.map((item) => item.topic))],
    });
  } catch (error) {
    console.error('[Questionário adaptativo] Falha ao preparar retake:', error.message);
    return res.status(500).json({ error: 'Não foi possível montar seu questionário adaptativo.' });
  }
};

exports.submitRetake = async (req, res) => {
  try {
    if (!await ensureStudent(req.user.id)) return res.status(403).json({ error: 'Apenas alunos podem enviar o questionário.' });
    const answers = req.body?.answers;
    if (!Array.isArray(answers) || answers.length !== QUESTIONS_PER_SUBJECT * SUBJECTS.length) {
      return res.status(400).json({ error: 'O questionário deve conter exatamente 20 respostas.' });
    }
    const ids = answers.map((answer) => String(answer.question_id));
    if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Cada questão deve ser respondida uma única vez.' });

    const { data: questions, error: questionsError } = await supabase.from('questions')
      .select('id, subject, topic, statement, options, correct_option, module')
      .eq('module', 'RETAKE').eq('is_initial', false).in('id', ids);
    if (questionsError) throw questionsError;
    const questionMap = new Map((questions || []).map((question) => [String(question.id), question]));
    if (questionMap.size !== answers.length) return res.status(400).json({ error: 'Uma ou mais questões não pertencem ao banco inédito.' });

    const counts = Object.fromEntries(SUBJECTS.map((item) => [item.key, 0]));
    let correctCount = 0;
    const weakTopics = new Map();
    const detailedAnswers = [];
    const results = [];
    for (const answer of answers) {
      const question = questionMap.get(String(answer.question_id));
      const subject = subjectFor(question.subject);
      const selectedOption = Number(answer.selected_option);
      const correctOption = Number(question.correct_option);
      if (!subject || !Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption > 4
        || !Number.isInteger(correctOption) || correctOption < 0 || correctOption > 4) {
        return res.status(400).json({ error: 'Resposta ou questão inválida.' });
      }
      counts[subject.key] += 1;
      const isCorrect = selectedOption === correctOption;
      if (isCorrect) correctCount += 1;
      else weakTopics.set(question.topic, (weakTopics.get(question.topic) || 0) + 1);
      detailedAnswers.push({ question_id: question.id, selected_option: selectedOption, is_correct: isCorrect });
      results.push({ question_id: question.id, subject: question.subject, topic: question.topic, statement: question.statement, selected_option: selectedOption, correct_option: correctOption, is_correct: isCorrect });
    }
    if (SUBJECTS.some((subject) => counts[subject.key] !== QUESTIONS_PER_SUBJECT)) {
      return res.status(400).json({ error: 'O questionário deve conter 10 questões de cada matéria.' });
    }

    const { data: diagnostic, error: diagnosticError } = await supabase.from('diagnostics')
      .insert({ user_id: req.user.id, score: correctCount, weak_topics: [...weakTopics].map(([topic, errorsCount]) => ({ topic, errorsCount })), module: 'RETAKE' })
      .select('id, created_at').single();
    if (diagnosticError) throw diagnosticError;
    const { error: answersError } = await supabase.from('diagnostic_answers')
      .insert(detailedAnswers.map((answer) => ({ ...answer, diagnostic_id: diagnostic.id })));
    if (answersError) throw answersError;

    const subjectScores = {};
    for (const subject of SUBJECTS) {
      const subjectResults = results.filter((item) => subjectFor(item.subject)?.key === subject.key);
      subjectScores[subject.key] = Math.round(subjectResults.filter((item) => item.is_correct).length / subjectResults.length * 100);
    }
    return res.status(201).json({
      diagnosticId: diagnostic.id,
      assessmentType: 'RETAKE',
      createdAt: diagnostic.created_at,
      score: correctCount,
      totalQuestions: answers.length,
      correctAnswers: correctCount,
      incorrectAnswers: answers.length - correctCount,
      overall_average: Math.round(correctCount / answers.length * 100),
      subjects: subjectScores,
      results,
    });
  } catch (error) {
    console.error('[Questionário adaptativo] Falha ao salvar retake:', error.message);
    return res.status(500).json({ error: 'Não foi possível salvar seu resultado.' });
  }
};
