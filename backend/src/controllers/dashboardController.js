const supabase = require('../config/supabase');

function subjectKey(subject = '') {
  const normalized = String(subject).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('portugu') || normalized.includes('lingua') || normalized.includes('linguagem')) return 'portuguese';
  if (normalized.includes('matema') || normalized.includes('math')) return 'math';
  return null;
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

    const { data: diagnostic, error: diagnosticError } = await supabase
      .from('diagnostics')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (diagnosticError) throw diagnosticError;

    const { data: studyPlan, error: studyPlanError } = await supabase
      .from('study_plans')
      .select('id, summary, weekly_focus, schedule, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (studyPlanError) throw studyPlanError;

    const subjects = {
      portuguese: { score: 0, status: 'Sem resultado', feedback: 'Conclua uma avaliação para ver seu desempenho.', strengths: [] },
      math: { score: 0, status: 'Sem resultado', feedback: 'Conclua uma avaliação para ver seu desempenho.', strengths: [] },
    };
    let totalQuestions = 0;
    let correctAnswers = 0;
    const weakTopics = { portuguese: new Set(), math: new Set() };

    if (diagnostic) {
      const { data: answers, error: answersError } = await supabase
        .from('diagnostic_answers')
        .select('question_id, is_correct')
        .eq('diagnostic_id', diagnostic.id);
      if (answersError) throw answersError;

      if (answers.length) {
        const questionIds = answers.map((answer) => answer.question_id);
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, subject, topic')
          .in('id', questionIds);
        if (questionsError) throw questionsError;

        const questionMap = new Map(questions.map((question) => [String(question.id), question]));
        const totals = {
          portuguese: { correct: 0, total: 0, strengths: new Set() },
          math: { correct: 0, total: 0, strengths: new Set() },
        };
        for (const answer of answers) {
          const question = questionMap.get(String(answer.question_id));
          const key = subjectKey(question?.subject);
          totalQuestions += 1;
          if (answer.is_correct) correctAnswers += 1;
          if (!key) continue;
          totals[key].total += 1;
          if (answer.is_correct) {
            totals[key].correct += 1;
            if (question.topic) totals[key].strengths.add(question.topic);
          } else if (question.topic) {
            weakTopics[key].add(question.topic);
          }
        }

        for (const key of Object.keys(totals)) {
          const { correct, total, strengths } = totals[key];
          if (!total) continue;
          const score = Math.round((correct / total) * 10000) / 100;
          subjects[key] = {
            score,
            status: score >= 70 ? 'Bom!' : 'Regular!',
            feedback: score >= 70 ? 'Bom trabalho! Continue praticando para avançar.' : 'Continue praticando para fortalecer seu desempenho.',
            strengths: [...strengths],
            weaknesses: [...weakTopics[key]],
          };
        }
      }
    }

    return res.status(200).json({
      user: {
        name: user.name,
        main_goal: user.main_goal || null,
        plan: user.plan || 'FREE',
      },
      hasDiagnostic: Boolean(diagnostic),
      study_plan: studyPlan,
      subjects,
      weak_topics: {
        portuguese: [...weakTopics.portuguese],
        math: [...weakTopics.math],
      },
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      overall_average: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 10000) / 100 : 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
