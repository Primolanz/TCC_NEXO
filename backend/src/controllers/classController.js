const { randomInt } = require('crypto');
const supabase = require('../config/adminSupabase');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  let suffix = '';
  for (let index = 0; index < 4; index += 1) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `NX-${suffix}`;
}

async function ensureApprovedTeacher(userId, res) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('role, status_approval')
    .eq('id', userId)
    .single();

  if (error || profile?.role !== 'TEACHER' || profile.status_approval !== 'APPROVED') {
    res.status(403).json({ error: 'Apenas professores aprovados podem acessar suas turmas.' });
    return false;
  }
  return true;
}

async function ensureStudent(userId, res) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || profile?.role !== 'STUDENT') {
    res.status(403).json({ error: 'Somente alunos podem entrar em uma turma.' });
    return false;
  }
  return true;
}

exports.joinClass = async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Informe o código da turma.' });

  try {
    if (!await ensureStudent(req.user.id, res)) return;

    const { data: classItem, error: classError } = await supabase
      .from('classes')
      .select('id, name, code, teacher_id, created_at')
      .eq('code', code)
      .maybeSingle();
    if (classError) throw classError;
    if (!classItem) return res.status(404).json({ error: 'Código de turma inválido. Confira e tente novamente.' });

    const { data: existing, error: membershipError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('class_id', classItem.id)
      .eq('student_id', req.user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (existing) return res.status(409).json({ error: 'Você já está matriculado nesta turma.' });

    const { error: insertError } = await supabase
      .from('class_students')
      .insert({ class_id: classItem.id, student_id: req.user.id });
    if (insertError?.code === '23505') {
      return res.status(409).json({ error: 'Você já está matriculado nesta turma.' });
    }
    if (insertError) throw insertError;

    const { data: teacher } = await supabase
      .from('users')
      .select('name')
      .eq('id', classItem.teacher_id)
      .maybeSingle();

    return res.status(201).json({
      message: 'Você entrou na turma com sucesso.',
      class: { ...classItem, teacher_name: teacher?.name || 'Professor' },
    });
  } catch (error) {
    console.error('[Turmas] Falha ao matricular aluno:', error.message);
    return res.status(500).json({ error: 'Não foi possível entrar na turma agora. Tente novamente.' });
  }
};

exports.listStudentClasses = async (req, res) => {
  try {
    if (!await ensureStudent(req.user.id, res)) return;

    const { data: memberships, error: membershipsError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', req.user.id);
    if (membershipsError) throw membershipsError;

    const classIds = [...new Set((memberships || []).map((item) => item.class_id))];
    if (!classIds.length) return res.json({ classes: [] });

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name, code, teacher_id, created_at')
      .in('id', classIds)
      .order('created_at', { ascending: false });
    if (classesError) throw classesError;

    const teacherIds = [...new Set((classes || []).map((item) => item.teacher_id))];
    const { data: teachers, error: teachersError } = teacherIds.length
      ? await supabase.from('users').select('id, name').in('id', teacherIds)
      : { data: [], error: null };
    if (teachersError) throw teachersError;
    const teacherNames = new Map((teachers || []).map((item) => [item.id, item.name]));

    const results = await Promise.all((classes || []).map(async (classItem) => {
      const { count, error: countError } = await supabase
        .from('class_students')
        .select('student_id', { count: 'exact', head: true })
        .eq('class_id', classItem.id);
      if (countError) throw countError;
      return {
        ...classItem,
        teacher_name: teacherNames.get(classItem.teacher_id) || 'Professor',
        classmate_count: Math.max(0, (count || 0) - 1),
      };
    }));

    return res.json({ classes: results });
  } catch (error) {
    console.error('[Turmas] Falha ao listar turmas do aluno:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar suas turmas.' });
  }
};

exports.listClasses = async (req, res) => {
  try {
    if (!await ensureApprovedTeacher(req.user.id, res)) return;

    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, code, teacher_id, created_at')
      .eq('teacher_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const results = await Promise.all((classes || []).map(async (classItem) => {
      const { count, error: countError } = await supabase
        .from('class_students')
        .select('class_id', { count: 'exact', head: true })
        .eq('class_id', classItem.id);
      if (countError) throw countError;
      return { ...classItem, student_count: count || 0 };
    }));

    return res.json({ classes: results });
  } catch (error) {
    console.error('[Turmas] Falha ao listar turmas:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar suas turmas.' });
  }
};

exports.createClass = async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Informe o nome da turma.' });

  try {
    if (!await ensureApprovedTeacher(req.user.id, res)) return;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generateCode();
      const { data: existing, error: lookupError } = await supabase
        .from('classes')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) continue;

      const { data: classItem, error } = await supabase
        .from('classes')
        .insert({ name, code, teacher_id: req.user.id })
        .select('id, name, code, teacher_id, created_at')
        .single();

      if (!error) return res.status(201).json({ message: 'Turma criada com sucesso.', class: { ...classItem, student_count: 0 } });
      if (error.code === '23505') continue;
      throw error;
    }

    return res.status(503).json({ error: 'Não foi possível gerar um código exclusivo agora. Tente novamente.' });
  } catch (error) {
    console.error('[Turmas] Falha ao criar turma:', error.message);
    return res.status(500).json({ error: 'Não foi possível criar a turma.' });
  }
};
