const supabase = require('../config/adminSupabase');

function isValidIsoDueDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  const validCalendarDate = calendarDate.getUTCFullYear() === year
    && calendarDate.getUTCMonth() === month - 1
    && calendarDate.getUTCDate() === day;
  return validCalendarDate && !Number.isNaN(Date.parse(value));
}

async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role, status_approval')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

exports.createAssignment = async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  const classId = String(req.body?.class_id || '').trim();
  const dueDate = req.body?.due_date || null;

  if (!title || !classId) {
    return res.status(400).json({ error: 'Informe o título e a turma da atividade.' });
  }
  if (dueDate && !isValidIsoDueDate(dueDate)) {
    return res.status(400).json({ error: 'Informe uma data de entrega válida no formato ISO 8601.' });
  }
  if (dueDate && Date.parse(dueDate) < Date.now()) {
    return res.status(400).json({ error: 'A data de entrega não pode ser anterior ao horário atual.' });
  }

  try {
    const profile = await getUserRole(req.user.id);
    if (profile.role !== 'TEACHER' || profile.status_approval !== 'APPROVED') {
      return res.status(403).json({ error: 'Apenas professores aprovados podem lançar atividades.' });
    }

    const { data: classItem, error: classError } = await supabase
      .from('classes')
      .select('id, name, teacher_id')
      .eq('id', classId)
      .eq('teacher_id', req.user.id)
      .maybeSingle();
    if (classError) throw classError;
    if (!classItem) return res.status(403).json({ error: 'Essa turma não pertence à sua conta.' });

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({ title, description, class_id: classItem.id, due_date: dueDate, created_by: req.user.id })
      .select('id, title, description, class_id, due_date, created_at')
      .single();
    if (error) {
      console.error('[Atividades] Erro do Supabase ao inserir em public.assignments:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        classId: classItem.id,
      });
      return res.status(500).json({ error: error.message || 'Erro desconhecido ao salvar a atividade.' });
    }

    return res.status(201).json({
      message: 'Atividade lançada com sucesso.',
      assignment: { ...assignment, class_name: classItem.name },
    });
  } catch (error) {
    console.error('[Atividades] Falha ao criar atividade:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return res.status(500).json({ error: error.message || 'Erro desconhecido ao lançar a atividade.' });
  }
};

exports.listStudentAssignments = async (req, res) => {
  try {
    const profile = await getUserRole(req.user.id);
    if (profile.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Somente alunos podem consultar as atividades das turmas.' });
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', req.user.id);
    if (membershipsError) throw membershipsError;

    const classIds = [...new Set((memberships || []).map((item) => item.class_id))];
    if (!classIds.length) return res.json({ assignments: [] });

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', classIds);
    if (classesError) throw classesError;
    const classNames = new Map((classes || []).map((item) => [item.id, item.name]));

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, description, class_id, due_date, created_at')
      .in('class_id', classIds)
      .order('due_date', { ascending: true, nullsFirst: false });
    if (error) throw error;

    const assignmentIds = (assignments || []).map((item) => item.id);
    const { data: submissions, error: submissionsError } = assignmentIds.length
      ? await supabase
        .from('assignment_submissions')
        .select('assignment_id, status')
        .eq('student_id', req.user.id)
        .in('assignment_id', assignmentIds)
      : { data: [], error: null };
    if (submissionsError) throw submissionsError;
    const submissionStatuses = new Map((submissions || []).map((item) => [item.assignment_id, item.status]));

    return res.json({
      assignments: (assignments || []).map((item) => ({
        ...item,
        class_name: classNames.get(item.class_id) || 'Turma',
        status: submissionStatuses.get(item.id) === 'SUBMITTED' ? 'SUBMITTED' : 'PENDING',
      })),
    });
  } catch (error) {
    console.error('[Atividades] Falha ao listar atividades do aluno:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar as atividades.' });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const profile = await getUserRole(req.user.id);
    if (profile.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Somente alunos podem concluir atividades.' });
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, class_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment) return res.status(404).json({ error: 'Atividade não encontrada.' });

    const { data: membership, error: membershipError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('class_id', assignment.class_id)
      .eq('student_id', req.user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return res.status(403).json({ error: 'Você não está matriculado nesta turma.' });

    const { data: existing, error: existingError } = await supabase
      .from('assignment_submissions')
      .select('assignment_id')
      .eq('assignment_id', assignment.id)
      .eq('student_id', req.user.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const { data: submission, error: saveError } = existing
      ? await supabase
        .from('assignment_submissions')
        .update({ status: 'SUBMITTED', submitted_at: new Date().toISOString() })
        .eq('assignment_id', assignment.id)
        .eq('student_id', req.user.id)
        .select('assignment_id, student_id, status')
        .single()
      : await supabase
        .from('assignment_submissions')
        .insert({ assignment_id: assignment.id, student_id: req.user.id, status: 'SUBMITTED', submitted_at: new Date().toISOString() })
        .select('assignment_id, student_id, status')
        .single();
    if (saveError) {
      if (saveError.code === '23505') {
        const { data: updated, error: updateError } = await supabase
          .from('assignment_submissions')
          .update({ status: 'SUBMITTED', submitted_at: new Date().toISOString() })
          .eq('assignment_id', assignment.id)
          .eq('student_id', req.user.id)
          .select('assignment_id, student_id, status')
          .single();
        if (updateError) throw updateError;
        return res.json({ message: 'Atividade marcada como concluída.', submission: updated });
      }
      throw saveError;
    }

    return res.json({ message: 'Atividade marcada como concluída.', submission });
  } catch (error) {
    console.error('[Atividades] Falha ao registrar conclusão:', {
      message: error.message, code: error.code, details: error.details, hint: error.hint,
    });
    return res.status(500).json({ error: error.message || 'Não foi possível concluir a atividade.' });
  }
};
