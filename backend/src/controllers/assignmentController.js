const supabase = require('../config/adminSupabase');
const SUBMISSION_BUCKET = 'assignment-submissions';
const INVALID_SUBMISSION_LINK = 'Envie apenas links válidos de entrega (ex: Google Drive, GitHub, Figma, Docs, Canva ou PDF). Links de redes sociais e vídeos não são aceitos.';

function getAllowedSubmissionUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const blockedHosts = ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'facebook.com'];
    if (blockedHosts.some((domain) => host === domain || host.endsWith(`.${domain}`))) return null;
    const allowedHosts = ['drive.google.com', 'docs.google.com', 'github.com', 'figma.com', 'canva.com', 'notion.so', 'onedrive.live.com'];
    const isAllowedHost = allowedHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));
    return isAllowedHost || url.pathname.toLowerCase().endsWith('.pdf') ? url : null;
  } catch {
    return null;
  }
}

async function getStudentAssignment(req, res) {
  const profile = await getUserRole(req.user.id);
  if (profile.role !== 'STUDENT') { res.status(403).json({ error: 'Somente alunos podem enviar atividades.' }); return null; }
  const { data: assignment, error: assignmentError } = await supabase.from('assignments').select('id, class_id').eq('id', req.params.id).maybeSingle();
  if (assignmentError) throw assignmentError;
  if (!assignment) { res.status(404).json({ error: 'Atividade não encontrada.' }); return null; }
  const { data: membership, error } = await supabase.from('class_students').select('class_id').eq('class_id', assignment.class_id).eq('student_id', req.user.id).maybeSingle();
  if (error) throw error;
  if (!membership) { res.status(403).json({ error: 'Você não está matriculado nesta turma.' }); return null; }
  return assignment;
}

async function resolveSubmissionLink(value) {
  if (!String(value || '').startsWith('storage://')) return value || null;
  const path = String(value).slice('storage://'.length);
  const { data, error } = await supabase.storage.from(SUBMISSION_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

exports.createSubmissionUploadUrl = async (req, res) => {
  try {
    const extension = typeof req.body?.file_name === 'string' ? req.body.file_name.toLowerCase().match(/\.(pdf|docx|doc|png|jpg)$/)?.[1] : null;
    const mimeByExtension = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc: 'application/msword', png: 'image/png', jpg: 'image/jpeg' };
    if (!extension || mimeByExtension[extension] !== req.body?.content_type || !Number.isInteger(req.body?.size) || req.body.size < 1 || req.body.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Use um arquivo PDF, DOC, DOCX, PNG ou JPG de até 10 MB.' });
    }
    if (!await getStudentAssignment(req, res)) return;
    const path = `${req.user.id}/${req.params.id}/${require('crypto').randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage.from(SUBMISSION_BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return res.json({ path, signedUrl: data.signedUrl });
  } catch (error) {
    console.error('[Atividades] Falha ao iniciar upload:', error.message);
    return res.status(500).json({ error: 'Não foi possível preparar o upload do arquivo.' });
  }
};

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
        .select('assignment_id, status, link_entrega, text_content, submitted_at, grade, feedback')
        .eq('student_id', req.user.id)
        .in('assignment_id', assignmentIds)
      : { data: [], error: null };
    if (submissionsError) throw submissionsError;
    const submissionStatuses = new Map((submissions || []).map((item) => [item.assignment_id, item.status]));

    return res.json({
      assignments: await Promise.all((assignments || []).map(async (item) => ({
        ...item,
        class_name: classNames.get(item.class_id) || 'Turma',
        status: submissionStatuses.get(item.id) === 'SUBMITTED' ? 'SUBMITTED' : 'PENDING',
        ...(submissions || []).find((submission) => submission.assignment_id === item.id),
        link_entrega: await resolveSubmissionLink((submissions || []).find((submission) => submission.assignment_id === item.id)?.link_entrega),
      }))),
    });
  } catch (error) {
    console.error('[Atividades] Falha ao listar atividades do aluno:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar as atividades.' });
  }
};

exports.listTeacherAssignments = async (req, res) => {
  try {
    const profile = await getUserRole(req.user.id);
    if (profile.role !== 'TEACHER' || profile.status_approval !== 'APPROVED') {
      return res.status(403).json({ error: 'Apenas professores aprovados podem consultar as atividades.' });
    }

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', req.user.id);
    if (classesError) throw classesError;
    const classNames = new Map((classes || []).map((item) => [item.id, item.name]));
    const classIds = [...classNames.keys()];
    if (!classIds.length) return res.json({ assignments: [] });

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, description, class_id, due_date, created_at')
      .in('class_id', classIds)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return res.json({ assignments: (assignments || []).map((item) => ({ ...item, class_name: classNames.get(item.class_id) || 'Turma' })) });
  } catch (error) {
    console.error('[Atividades] Falha ao listar atividades do professor:', error.message);
    return res.status(500).json({ error: 'Não foi possível carregar as atividades.' });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const storagePath = String(req.body?.storage_path || '').trim();
    const rawSubmissionUrl = String(req.body?.link_entrega || '').trim();
    const submissionUrl = getAllowedSubmissionUrl(rawSubmissionUrl);
    const textContent = String(req.body?.text_content || '').trim();
    const ownsStoragePath = storagePath.startsWith(`${req.user.id}/${req.params.id}/`) && !storagePath.includes('..');
    if (textContent.length > 10000) return res.status(400).json({ error: 'A resposta de texto deve ter até 10.000 caracteres.' });
    if ((rawSubmissionUrl && !submissionUrl) || (storagePath && !ownsStoragePath) || (submissionUrl && storagePath)) {
      return res.status(400).json({ error: INVALID_SUBMISSION_LINK });
    }
    if (!submissionUrl && !ownsStoragePath && !textContent) {
      return res.status(400).json({ error: 'Envie uma resposta de texto, um link válido ou um arquivo.' });
    }
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

    const storedLink = storagePath ? `storage://${storagePath}` : submissionUrl?.toString() || null;
    const submissionFields = { status: 'SUBMITTED', submitted_at: new Date().toISOString(), link_entrega: storedLink, text_content: textContent || null };
    const { data: submission, error: saveError } = existing
      ? await supabase
        .from('assignment_submissions')
        .update(submissionFields)
        .eq('assignment_id', assignment.id)
        .eq('student_id', req.user.id)
        .select('assignment_id, student_id, status, submitted_at, link_entrega, text_content, grade, feedback')
        .single()
      : await supabase
        .from('assignment_submissions')
        .insert({ assignment_id: assignment.id, student_id: req.user.id, ...submissionFields })
        .select('assignment_id, student_id, status, submitted_at, link_entrega, text_content, grade, feedback')
        .single();
    if (saveError) {
      if (saveError.code === '23505') {
        const { data: updated, error: updateError } = await supabase
          .from('assignment_submissions')
          .update(submissionFields)
          .eq('assignment_id', assignment.id)
          .eq('student_id', req.user.id)
          .select('assignment_id, student_id, status, submitted_at, link_entrega, text_content, grade, feedback')
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
