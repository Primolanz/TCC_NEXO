const supabase = require('../config/adminSupabase');

async function ensureTeacher(userId) {
  const { data, error } = await supabase.from('users').select('role, status_approval').eq('id', userId).single();
  if (error) throw error;
  return data?.role === 'TEACHER' && data?.status_approval === 'APPROVED';
}

async function getOwnedClass(classId, teacherId) {
  const { data, error } = await supabase.from('classes').select('id, name, teacher_id').eq('id', classId).eq('teacher_id', teacherId).maybeSingle();
  if (error) throw error;
  return data;
}

exports.listClassStudents = async (req, res) => {
  try {
    if (!await ensureTeacher(req.user.id)) return res.status(403).json({ error: 'Apenas professores aprovados podem acessar os alunos.' });
    const classItem = await getOwnedClass(req.params.classId, req.user.id);
    if (!classItem) return res.status(404).json({ error: 'Turma não encontrada.' });

    const { data: memberships, error } = await supabase.from('class_students').select('student_id').eq('class_id', classItem.id);
    if (error) throw error;
    const studentIds = [...new Set((memberships || []).map((item) => item.student_id))];
    if (!studentIds.length) return res.json({ students: [] });

    const [{ data: students, error: studentsError }, { data: assignments, error: assignmentsError }] = await Promise.all([
      supabase.from('users').select('id, name, email').in('id', studentIds).order('name'),
      supabase.from('assignments').select('id').eq('class_id', classItem.id),
    ]);
    if (studentsError) throw studentsError;
    if (assignmentsError) throw assignmentsError;
    const assignmentIds = (assignments || []).map((item) => item.id);
    const { data: submissions, error: submissionsError } = assignmentIds.length
      ? await supabase.from('assignment_submissions').select('student_id, assignment_id, status').in('student_id', studentIds).in('assignment_id', assignmentIds)
      : { data: [], error: null };
    if (submissionsError) throw submissionsError;
    const submittedByStudent = new Map();
    for (const item of submissions || []) {
      if (item.status === 'SUBMITTED') submittedByStudent.set(item.student_id, (submittedByStudent.get(item.student_id) || 0) + 1);
    }
    return res.json({ students: (students || []).map((student) => {
      const completed_count = submittedByStudent.get(student.id) || 0;
      return { ...student, completed_count, pending_count: Math.max(0, assignmentIds.length - completed_count), assignment_count: assignmentIds.length };
    }) });
  } catch (error) {
    console.error('[Professor] Falha ao listar alunos:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar os alunos da turma.' });
  }
};

exports.getStudentPerformance = async (req, res) => {
  try {
    if (!await ensureTeacher(req.user.id)) return res.status(403).json({ error: 'Apenas professores aprovados podem consultar desempenho.' });
    const classId = String(req.query.class_id || '');
    if (!classId) return res.status(400).json({ error: 'Informe a turma para consultar o desempenho.' });
    const classItem = await getOwnedClass(classId, req.user.id);
    if (!classItem) return res.status(404).json({ error: 'Turma não encontrada.' });

    const { data: membership, error: membershipError } = await supabase.from('class_students').select('student_id').eq('class_id', classId).eq('student_id', req.params.studentId).maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return res.status(404).json({ error: 'Aluno não encontrado nesta turma.' });

    const [{ data: student, error: studentError }, { data: assignments, error: assignmentsError }] = await Promise.all([
      supabase.from('users').select('id, name, email').eq('id', req.params.studentId).maybeSingle(),
      supabase.from('assignments').select('id, title, description, due_date, created_at').eq('class_id', classId).order('due_date', { ascending: true, nullsFirst: false }),
    ]);
    if (studentError) throw studentError;
    if (assignmentsError) throw assignmentsError;
    if (!student) return res.status(404).json({ error: 'Aluno não encontrado.' });
    const assignmentIds = (assignments || []).map((item) => item.id);
    const { data: submissions, error: submissionsError } = assignmentIds.length
      ? await supabase.from('assignment_submissions').select('assignment_id, status, submitted_at').eq('student_id', student.id).in('assignment_id', assignmentIds)
      : { data: [], error: null };
    if (submissionsError) throw submissionsError;
    const byAssignment = new Map((submissions || []).map((item) => [item.assignment_id, item]));
    const now = Date.now();
    const performance = (assignments || []).map((item) => {
      const submission = byAssignment.get(item.id);
      const submitted = submission?.status === 'SUBMITTED';
      return { ...item, status: submitted ? 'SUBMITTED' : 'PENDING', submitted_at: submitted ? (submission.submitted_at || null) : null, overdue: !submitted && Boolean(item.due_date) && Date.parse(item.due_date) < now };
    });
    return res.json({ student, class: classItem, completed_count: performance.filter((item) => item.status === 'SUBMITTED').length, assignment_count: performance.length, assignments: performance });
  } catch (error) {
    console.error('[Professor] Falha ao consultar desempenho:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar o desempenho do aluno.' });
  }
};
