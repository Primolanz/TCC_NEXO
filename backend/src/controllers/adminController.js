const supabase = require('../config/adminSupabase');

async function requireAdmin(req, res) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || profile?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito a administradores.' });
    return false;
  }
  return true;
}

exports.getOverview = async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return;
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
    const [students, pending, approved, pendingProfiles, allProfiles, classes, monthlySubmissions, tutorCalls, recentProfiles, recentSubmissions] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'STUDENT'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'TEACHER').eq('status_approval', 'PENDING'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'TEACHER').eq('status_approval', 'APPROVED'),
      supabase.from('users').select('id, name, email, role, status_approval, created_at').eq('role', 'TEACHER').eq('status_approval', 'PENDING').order('created_at', { ascending: true }),
      supabase.from('users').select('id, name, email, role, status_approval, created_at').order('created_at', { ascending: false }).range(0, 999),
      supabase.from('classes').select('id', { count: 'exact', head: true }),
      supabase.from('assignment_submissions').select('assignment_id', { count: 'exact', head: true }).eq('status', 'SUBMITTED').gte('submitted_at', monthStart),
      supabase.from('tutor_interactions').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id, name, role, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('assignment_submissions').select('assignment_id, student_id, submitted_at').eq('status', 'SUBMITTED').order('submitted_at', { ascending: false }).limit(5),
    ]);
    const failed = [students, pending, approved, pendingProfiles, allProfiles, classes, monthlySubmissions, tutorCalls, recentProfiles, recentSubmissions].find((result) => result.error);
    if (failed) throw failed.error;

    const recentAssignmentIds = [...new Set((recentSubmissions.data || []).map((item) => item.assignment_id))];
    const recentStudentIds = [...new Set((recentSubmissions.data || []).map((item) => item.student_id))];
    const [{ data: recentAssignments, error: recentAssignmentsError }, { data: recentStudents, error: recentStudentsError }] = await Promise.all([
      recentAssignmentIds.length ? supabase.from('assignments').select('id, title').in('id', recentAssignmentIds) : Promise.resolve({ data: [], error: null }),
      recentStudentIds.length ? supabase.from('users').select('id, name').in('id', recentStudentIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (recentAssignmentsError) throw recentAssignmentsError;
    if (recentStudentsError) throw recentStudentsError;
    const assignmentsById = new Map((recentAssignments || []).map((item) => [item.id, item.title]));
    const studentsById = new Map((recentStudents || []).map((item) => [item.id, item.name]));
    const activityFeed = [
      ...(recentProfiles.data || []).map((item) => ({ id: `user-${item.id}`, type: 'signup', label: `${item.name || 'Novo usuário'} criou uma conta`, created_at: item.created_at })),
      ...(recentSubmissions.data || []).map((item) => ({ id: `submission-${item.assignment_id}-${item.student_id}`, type: 'submission', label: `${studentsById.get(item.student_id) || 'Aluno'} entregou ${assignmentsById.get(item.assignment_id) || 'uma atividade'}`, created_at: item.submitted_at })),
    ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 8);

    return res.json({
      metrics: {
        students: students.count || 0,
        pendingTeachers: pending.count || 0,
        approvedTeachers: approved.count || 0,
        totalUsers: allProfiles.data.length,
        classes: classes.count || 0,
        monthlySubmissions: monthlySubmissions.count || 0,
        tutorCalls: tutorCalls.count || 0,
      },
      activityFeed,
      pendingTeachers: pendingProfiles.data,
      users: allProfiles.data,
    });
  } catch (error) {
    console.error('[Admin] Falha ao carregar painel:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar os dados administrativos.' });
  }
};

exports.setTeacherApproval = async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return;
    const status = String(req.body.status || '').toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Informe uma decisão de aprovação válida.' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ status_approval: status })
      .eq('id', req.params.id)
      .eq('role', 'TEACHER')
      .eq('status_approval', 'PENDING')
      .select('id, name, email, role, status_approval, created_at')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Solicitação pendente não encontrada.' });
    return res.json({ message: status === 'APPROVED' ? 'Professor aprovado com sucesso.' : 'Cadastro do professor rejeitado.', user: data });
  } catch (error) {
    console.error('[Admin] Falha ao atualizar aprovação:', error.message);
    return res.status(500).json({ error: 'Não foi possível atualizar a solicitação.' });
  }
};
