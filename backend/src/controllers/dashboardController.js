const supabase = require('../config/supabase');

function subjectKey(subject = '') {
  const normalized = String(subject).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('portugu') || normalized.includes('lingua') || normalized.includes('linguagem')) return 'portuguese';
  if (normalized.includes('matema') || normalized.includes('math')) return 'math';
  return null;
}

function classifyPerformance(score) {
  if (score < 40) return { status: 'Precisa de Atenção', category: 'insuficiente' };
  if (score < 70) return { status: 'Regular', category: 'regular' };
  if (score < 90) return { status: 'Bom Desempenho', category: 'bom' };
  return { status: 'Excelente', category: 'excelente' };
}

function buildAssessment(diagnostic, answers, questionMap) {
  const totals = {
    portuguese: { correct: 0, total: 0, strengths: new Set(), weaknesses: new Set() },
    math: { correct: 0, total: 0, strengths: new Set(), weaknesses: new Set() },
  };
  const topicTotals = new Map();
  let correctAnswers = 0;

  for (const answer of answers) {
    const question = questionMap.get(String(answer.question_id));
    if (answer.is_correct) correctAnswers += 1;
    const key = subjectKey(question?.subject);
    if (!key) continue;

    if (question?.topic) {
      const topicKey = `${key}:${question.topic}`;
      const topicTotal = topicTotals.get(topicKey) || { subject: key, topic: question.topic, correct: 0, total: 0 };
      topicTotal.total += 1;
      if (answer.is_correct) topicTotal.correct += 1;
      topicTotals.set(topicKey, topicTotal);
    }

    totals[key].total += 1;
    if (answer.is_correct) {
      totals[key].correct += 1;
      if (question.topic) totals[key].strengths.add(question.topic);
    } else if (question.topic) {
      totals[key].weaknesses.add(question.topic);
    }
  }

  const subjects = {};
  for (const key of Object.keys(totals)) {
    const { correct, total, strengths, weaknesses } = totals[key];
    if (!total) {
      subjects[key] = { score: null, status: 'Sem resultado', category: 'sem-resultado', strengths: [], weaknesses: [] };
      continue;
    }

    const score = Math.round((correct / total) * 10000) / 100;
    const classification = classifyPerformance(score);
    subjects[key] = {
      score,
      ...classification,
      feedback: score >= 70
        ? 'Bom trabalho! Continue praticando para avançar.'
        : 'Continue praticando para fortalecer seu desempenho.',
      strengths: [...strengths],
      weaknesses: [...weaknesses],
    };
  }

  const totalQuestions = answers.length;
  const legacyScore = diagnostic.score === null || diagnostic.score === undefined
    ? null
    : Number(diagnostic.score);
  const overallAverage = totalQuestions
    ? Math.round((correctAnswers / totalQuestions) * 10000) / 100
    : Number.isFinite(legacyScore) ? Math.round(legacyScore * 5 * 100) / 100 : 0;

  return {
    diagnostic_id: diagnostic.id,
    assessment_type: diagnostic.module || 'INITIAL',
    created_at: diagnostic.created_at,
    total_questions: totalQuestions,
    correct_answers: totalQuestions ? correctAnswers : 0,
    overall_average: overallAverage,
    subjects,
    topics: [...topicTotals.values()].map((item) => ({
      subject: item.subject,
      topic: item.topic,
      score: Math.round((item.correct / item.total) * 100),
      correct: item.correct,
      total: item.total,
    })),
  };
}

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, main_goal, plan')
      .eq('id', userId)
      .single();
    if (userError) throw userError;

    const [diagnosticsResult, studyPlanResult] = await Promise.all([
      supabase
        .from('diagnostics')
        .select('id, score, created_at, module')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('study_plans')
        .select('id, summary, weekly_focus, schedule, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (diagnosticsResult.error) throw diagnosticsResult.error;
    if (studyPlanResult.error) throw studyPlanResult.error;

    const diagnostics = diagnosticsResult.data || [];
    const latestStudyPlan = studyPlanResult.data;
    const { data: studyProgress, error: progressError } = latestStudyPlan
      ? await supabase.from('study_plan_progress').select('day_index, topic, subject, completed_at').eq('study_plan_id', latestStudyPlan.id).eq('user_id', userId)
      : { data: [], error: null };
    if (progressError) throw progressError;
    const diagnosticIds = diagnostics.map((item) => item.id);
    let answers = [];
    let questionMap = new Map();

    if (diagnosticIds.length) {
      const { data: answerRows, error: answersError } = await supabase
        .from('diagnostic_answers')
        .select('diagnostic_id, question_id, is_correct')
        .in('diagnostic_id', diagnosticIds);
      if (answersError) throw answersError;
      answers = answerRows || [];

      const questionIds = [...new Set(answers.map((answer) => answer.question_id))];
      if (questionIds.length) {
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, subject, topic')
          .in('id', questionIds);
        if (questionsError) throw questionsError;
        questionMap = new Map((questions || []).map((question) => [String(question.id), question]));
      }
    }

    const snapshots = diagnostics.map((diagnostic) => buildAssessment(
      diagnostic,
      answers.filter((answer) => String(answer.diagnostic_id) === String(diagnostic.id)),
      questionMap,
    ));
    const current = snapshots[0] || null;
    const subjects = current?.subjects || {
      portuguese: { score: null, status: 'Sem resultado', category: 'sem-resultado', strengths: [], weaknesses: [] },
      math: { score: null, status: 'Sem resultado', category: 'sem-resultado', strengths: [], weaknesses: [] },
    };
    const weakTopics = {
      portuguese: subjects.portuguese.weaknesses || [],
      math: subjects.math.weaknesses || [],
    };
    let retakeNumber = 0;
    const history = [...snapshots].reverse().map((assessment) => {
      if (assessment.assessment_type === 'RETAKE') retakeNumber += 1;
      return { ...assessment, label: assessment.assessment_type === 'RETAKE' ? `Retomada ${retakeNumber}` : 'Avaliação inicial' };
    });

    return res.status(200).json({
      user: {
        name: user.name,
        main_goal: user.main_goal || null,
        plan: user.plan || 'FREE',
      },
      hasDiagnostic: Boolean(current),
      study_plan: latestStudyPlan,
      study_plan_progress: studyProgress || [],
      subjects,
      weak_topics: weakTopics,
      total_questions: current?.total_questions || 0,
      correct_answers: current?.correct_answers || 0,
      overall_average: current?.overall_average || 0,
      overall_status: current ? classifyPerformance(current.overall_average) : { status: 'Sem resultado', category: 'sem-resultado' },
      history,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
