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
    const [students, pending, approved, pendingProfiles, allProfiles] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'STUDENT'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'TEACHER').eq('status_approval', 'PENDING'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'TEACHER').eq('status_approval', 'APPROVED'),
      supabase.from('users').select('id, name, email, role, status_approval, created_at').eq('role', 'TEACHER').eq('status_approval', 'PENDING').order('created_at', { ascending: true }),
      supabase.from('users').select('id, name, email, role, status_approval, created_at').order('created_at', { ascending: false }).range(0, 999),
    ]);
    const failed = [students, pending, approved, pendingProfiles, allProfiles].find((result) => result.error);
    if (failed) throw failed.error;

    return res.json({
      metrics: {
        students: students.count || 0,
        pendingTeachers: pending.count || 0,
        approvedTeachers: approved.count || 0,
        totalUsers: allProfiles.data.length,
      },
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
