import { useCallback, useEffect, useState } from 'react'
import { BookOpen, ClipboardList, FilePlus, LayoutDashboard, UsersRound, X } from 'lucide-react'
import RoleDashboard from '../componentes/RoleDashboard.jsx'
import { apiClient } from '../servicos/apiClient.js'

const navigation = [
  { id: 'inicio', title: 'Início', icon: <LayoutDashboard /> },
  { id: 'turmas', title: 'Minhas Turmas', icon: <UsersRound /> },
  { id: 'atividade', title: 'Lançar Atividade', icon: <FilePlus /> },
  { id: 'relatorios', title: 'Relatórios', icon: <BookOpen /> },
]

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const horarios = [
  ...Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`),
  '23:59',
]

function dateTimePartsInSaoPaulo(date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value }) => [type, value]))
}

function formatSaoPauloDateTimeLocal(date) {
  const parts = dateTimePartsInSaoPaulo(date)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function getMinimumSaoPauloDateTime() {
  return formatSaoPauloDateTimeLocal(new Date(Math.ceil(Date.now() / 60000) * 60000))
}

function dateTimeLocalToIsoSaoPaulo(value) {
  if (!value || !value.includes('T') || value.endsWith('T')) return null
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const localWallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const represented = dateTimePartsInSaoPaulo(new Date(localWallClockAsUtc))
  const saoPauloWallClockAsUtc = Date.UTC(
    Number(represented.year), Number(represented.month) - 1, Number(represented.day),
    Number(represented.hour), Number(represented.minute),
  )
  const offset = saoPauloWallClockAsUtc - localWallClockAsUtc
  return new Date(localWallClockAsUtc - offset).toISOString()
}

function formatDatePtBr(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = dateTimePartsInSaoPaulo(date)
  return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`
}

function DashboardProfessor() {
  const [dataAtualFormatadaISO, setDataAtualFormatadaISO] = useState(getMinimumSaoPauloDateTime)
  const [dataEntrega, setDataEntrega] = useState({ dia: '', mes: '', ano: '' })
  const [horarioEntrega, setHorarioEntrega] = useState('')
  const [classes, setClasses] = useState([])
  const [activities, setActivities] = useState([])
  const [creatingActivity, setCreatingActivity] = useState(false)
  const [activityError, setActivityError] = useState('')
  const [activitySuccess, setActivitySuccess] = useState('')
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [creatingClass, setCreatingClass] = useState(false)
  const [classError, setClassError] = useState('')
  const [classSuccess, setClassSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentPerformance, setStudentPerformance] = useState(null)
  const [studentLoading, setStudentLoading] = useState(false)
  const [studentError, setStudentError] = useState('')
  const [classStudents, setClassStudents] = useState({})
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [reports, setReports] = useState({ evaluatedStudentCount: 0, averagePerformance: null, classes: [] })
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [selectedReportClass, setSelectedReportClass] = useState(null)
  const dataHojeISO = dataAtualFormatadaISO.slice(0, 10)
  const anoAtual = Number(dataHojeISO.slice(0, 4))
  const diasNoMes = dataEntrega.mes && dataEntrega.ano
    ? new Date(Number(dataEntrega.ano), Number(dataEntrega.mes), 0).getDate()
    : 31
  const dataEntregaISO = dataEntrega.dia && dataEntrega.mes && dataEntrega.ano
    ? `${dataEntrega.ano}-${dataEntrega.mes}-${dataEntrega.dia}`
    : ''

  useEffect(() => {
    const atualizarMinimo = () => setDataAtualFormatadaISO(getMinimumSaoPauloDateTime())
    const timer = window.setInterval(atualizarMinimo, 15000)
    return () => window.clearInterval(timer)
  }, [])

  const carregarTurmas = useCallback(async () => {
    setLoadingClasses(true)
    try {
      const response = await apiClient('/classes')
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar suas turmas.')
      setClasses(Array.isArray(body.classes) ? body.classes : [])
      setClassError('')
    } catch (error) {
      setClassError(error.message)
      throw error
    } finally {
      setLoadingClasses(false)
    }
  }, [])

  useEffect(() => { carregarTurmas().catch(() => {}) }, [carregarTurmas])

  async function carregarRelatorios() {
    setReportsLoading(true)
    setReportsError('')
    try {
      const response = await apiClient('/teacher/reports')
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar os relatórios.')
      setReports(body)
      setSelectedReportClass((current) => current ? { ...current, report: (body.classes || []).find((item) => item.id === current.id) } : null)
    } catch (error) {
      setReportsError(error.message)
    } finally {
      setReportsLoading(false)
    }
  }

  async function criarTurma(event) {
    event.preventDefault()
    setClassError('')
    setClassSuccess('')
    setCreatingClass(true)
    const form = event.currentTarget
    const name = String(new FormData(form).get('nome') || '').trim()

    try {
      const response = await apiClient('/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível criar a turma.')
      setClasses((current) => [body.class, ...current.filter((item) => item.id !== body.class.id)])
      setClassSuccess(`Turma criada. Código de acesso: ${body.class.code}`)
      form.reset()
      carregarTurmas().catch(() => {})
    } catch (error) {
      setClassError(error.message)
    } finally {
      setCreatingClass(false)
    }
  }

  async function copiarCodigo(code) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setClassError('')
    } catch {
      setClassError('Não foi possível copiar o código. Selecione e copie o texto manualmente.')
    }
  }

  async function abrirDesempenho(student, classItem) {
    setSelectedStudent({ ...student, classItem })
    setStudentPerformance(null)
    setStudentError('')
    setStudentLoading(true)
    try {
      const response = await apiClient(`/teacher/students/${encodeURIComponent(student.id)}/performance?class_id=${encodeURIComponent(classItem.id)}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar o desempenho.')
      setStudentPerformance(body)
    } catch (error) {
      setStudentError(error.message)
    } finally {
      setStudentLoading(false)
    }
  }

  async function carregarAlunos(classId) {
    setStudentsLoading(true)
    try {
      const response = await apiClient(`/teacher/classes/${encodeURIComponent(classId)}/students`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar os alunos.')
      setClassStudents((current) => ({ ...current, [classId]: body.students || [] }))
    } catch (error) {
      setClassStudents((current) => ({ ...current, [classId]: { error: error.message } }))
    } finally {
      setStudentsLoading(false)
    }
  }

  function formatarDataAluno(value) {
    if (!value) return 'Data não registrada'
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)).replace(',', ' às')
  }

  async function lancarAtividade(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setActivityError('')
    setActivitySuccess('')
    if (!dataEntregaISO || !horarioEntrega) {
      setActivityError('Selecione a data e o horário limite da atividade.')
      return
    }
    setCreatingActivity(true)

    try {
      const response = await apiClient('/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(form.get('titulo') || '').trim(),
          description: String(form.get('descricao') || '').trim(),
          class_id: String(form.get('turma') || ''),
          due_date: dateTimeLocalToIsoSaoPaulo(`${dataEntregaISO}T${horarioEntrega}`),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível lançar a atividade.')
      setActivities((current) => [body.assignment, ...current])
      setActivitySuccess('Atividade lançada com sucesso. Ela já está disponível para os alunos da turma.')
      formElement.reset()
      setDataEntrega({ dia: '', mes: '', ano: '' })
      setHorarioEntrega('')
    } catch (error) {
      setActivityError(error.message)
    } finally {
      setCreatingActivity(false)
    }
  }

  function renderContent({ user, activeTab, goToTab }) {
    const selectedClassReport = selectedReportClass ? reports.classes.find((report) => report.id === selectedReportClass.id) : null
    if (activeTab === 'inicio') {
      const metrics = [
        { title: 'Turmas criadas', value: classes.length, badge: 'Minhas turmas', icon: '▦' },
        { title: 'Alunos vinculados', value: classes.reduce((sum, item) => sum + (item.student_count || 0), 0), badge: 'Todas as turmas', icon: '♙' },
        { title: 'Atividades lançadas', value: activities.length, badge: 'Atividades', icon: '✎' },
      ]
      return <>
        <div className="role-metrics teacher-metrics-grid">
          {metrics.map((metric, index) => <article className="role-card teacher-metric-card" key={metric.title}>
            <span className="role-card-icon" aria-hidden="true">{index === 0 ? <BookOpen size={20} strokeWidth={1.8} /> : index === 1 ? <UsersRound size={20} strokeWidth={1.8} /> : <ClipboardList size={20} strokeWidth={1.8} />}</span>
            <p>{metric.title}</p>
            <strong>{metric.value}</strong>
            <button type="button" className="teacher-metric-shortcut" onClick={() => goToTab(index === 2 ? 'atividade' : 'turmas')}>{metric.badge}<span aria-hidden="true">→</span></button>
          </article>)}
        </div>
        <section className="role-panel role-quick-actions" aria-labelledby="acoes-rapidas-titulo">
          <div className="role-panel-heading"><div><span className="role-kicker">ATALHOS</span><h2 id="acoes-rapidas-titulo">Ações rápidas</h2></div><span className="role-badge">Seu espaço de ensino</span></div>
          <div className="role-action-grid">
            <button className="role-action-card" type="button" onClick={() => goToTab('turmas')}><span className="role-card-icon" aria-hidden="true">＋</span><span><strong>Criar nova turma</strong><small>Organize seus alunos por turma.</small></span><b aria-hidden="true">→</b></button>
            <button className="role-action-card" type="button" onClick={() => goToTab('atividade')}><span className="role-card-icon role-icon-teal" aria-hidden="true">✎</span><span><strong>Lançar atividade</strong><small>Prepare uma tarefa para sua turma.</small></span><b aria-hidden="true">→</b></button>
          </div>
        </section>
        <p className="role-home-note">Olá, Professor(a) {user.name || ''}. Seu painel reúne os principais números e atalhos para o dia a dia.</p>
      </>
    }

    if (activeTab === 'turmas') return <section className="role-tab-panel" aria-labelledby="turmas-titulo">
      <header className="role-panel-heading">
        <div><span className="role-kicker">ORGANIZAÇÃO</span><h2 id="turmas-titulo">Minhas Turmas</h2><p>Crie e acompanhe suas turmas em um só lugar.</p></div>
        <span className="role-badge">{classes.length} {classes.length === 1 ? 'turma' : 'turmas'}</span>
      </header>
      {classSuccess && <p className="class-toast class-toast-success" role="status">{classSuccess}</p>}
      {classError && <p className="class-toast class-toast-error" role="alert">{classError}</p>}
      <form className="role-form" onSubmit={criarTurma}>
        <h3>Criar nova turma</h3>
        <div className="role-form-grid"><label>Nome da turma<input name="nome" placeholder="Ex.: 8º ano A" maxLength="100" required /></label></div>
        <button className="role-primary-button" type="submit" disabled={creatingClass}>{creatingClass ? 'Criando turma…' : '＋ Criar turma'}</button>
      </form>
      <div className="role-list-heading"><h3>Turmas cadastradas</h3><span>{classes.length} no total</span></div>
      {loadingClasses && classes.length === 0 ? <div className="role-empty-state"><strong>Carregando turmas…</strong></div> : classes.length ? <div className="role-list">
        {classes.map((item) => <article className="role-list-item class-list-item class-list-item-clicavel" key={item.id} tabIndex={0} aria-label={`Abrir alunos da turma ${item.name}`} onClick={() => carregarAlunos(item.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); carregarAlunos(item.id) } }}>
          <span className="role-card-icon" aria-hidden="true">▦</span>
          <div className="class-list-details"><strong>{item.name}</strong><small>{item.student_count || 0} {(item.student_count || 0) === 1 ? 'aluno' : 'alunos'}</small><span className="class-code"><span>Código de acesso</span><code>{item.code}</code></span></div>
          <div className="class-actions"><button className="class-copy-button" type="button" onClick={(event) => { event.stopPropagation(); copiarCodigo(item.code) }}>{copiedCode === item.code ? 'Copiado!' : 'Copiar código'}</button><button className="role-secondary-button" type="button" onClick={(event) => { event.stopPropagation(); carregarAlunos(item.id) }}>Ver alunos</button></div>
          {classStudents[item.id] && <div className="class-student-list"><h4>Alunos matriculados</h4>{classStudents[item.id].error ? <p role="alert">{classStudents[item.id].error}</p> : classStudents[item.id].length ? classStudents[item.id].map((student) => <button type="button" className="student-row" key={student.id} onClick={(event) => { event.stopPropagation(); abrirDesempenho(student, item) }}><span><strong>{student.name}</strong><small>{student.email}</small></span><span className="role-badge">{student.completed_count}/{student.assignment_count} concluídas</span></button>) : <p>{studentsLoading ? 'Carregando alunos…' : 'Nenhum aluno matriculado nesta turma.'}</p>}</div>}
        </article>)}
      </div> : <div className="role-empty-state"><span className="role-empty-icon">▦</span><strong>Nenhuma turma criada</strong><p>Use o formulário acima para cadastrar sua primeira turma.</p>{classError && <button className="role-secondary-button" type="button" onClick={() => carregarTurmas().catch(() => {})}>Tentar novamente</button>}</div>}
    </section>

    if (activeTab === 'atividade') {
      return <section className="role-tab-panel" aria-labelledby="atividade-titulo">
        <header className="role-panel-heading"><div><span className="role-kicker">CONTEÚDO PEDAGÓGICO</span><h2 id="atividade-titulo">Lançar Atividade</h2><p>Crie uma tarefa e associe a uma de suas turmas.</p></div><span className="role-badge">{activities.length} lançadas</span></header>
        {activitySuccess && <p className="class-toast class-toast-success" role="status">{activitySuccess}</p>}
        {activityError && <p className="class-toast class-toast-error" role="alert">{activityError}</p>}
        {classes.length ? <form className="role-form" onSubmit={lancarAtividade}>
          <h3>Nova atividade</h3><div className="role-form-grid">
            <label>Turma<select name="turma" defaultValue="" required><option value="" disabled>Selecione uma turma</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Título da atividade<input name="titulo" placeholder="Ex.: Revisão de frações" maxLength="180" required /></label>
            <label className="role-form-wide">Instruções / Conteúdo<textarea name="descricao" placeholder="Descreva o que os alunos devem fazer." rows="4" /></label>
            <label>Data de entrega <small>(DD/MM/AAAA)</small><span className="role-date-selects">
              <select aria-label="Dia de entrega" value={dataEntrega.dia} onChange={(event) => setDataEntrega((current) => ({ ...current, dia: event.target.value }))} required>
                <option value="">DD</option>{Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0')).map((dia) => {
                  const candidata = `${dataEntrega.ano}-${dataEntrega.mes}-${dia}`
                  const disabled = !dataEntrega.mes || !dataEntrega.ano || Number(dia) > diasNoMes || candidata < dataHojeISO
                  return <option key={dia} value={dia} disabled={disabled}>{dia}</option>
                })}
              </select>
              <select aria-label="Mês de entrega" value={dataEntrega.mes} onChange={(event) => setDataEntrega((current) => ({ ...current, mes: event.target.value, dia: '' }))} required>
                <option value="">MM</option>{meses.map((mes, index) => <option key={mes} value={String(index + 1).padStart(2, '0')}>{mes}</option>)}
              </select>
              <select aria-label="Ano de entrega" value={dataEntrega.ano} onChange={(event) => setDataEntrega((current) => ({ ...current, ano: event.target.value, dia: '' }))} required>
                <option value="">AAAA</option>{Array.from({ length: 11 }, (_, index) => anoAtual + index).map((ano) => <option key={ano} value={String(ano)}>{ano}</option>)}
              </select>
            </span></label>
            <label>Horário limite (24h)<select aria-label="Horário limite no formato 24 horas" value={horarioEntrega} onChange={(event) => setHorarioEntrega(event.target.value)} required>
              <option value="">Selecione o horário</option>{horarios.map((horario) => <option key={horario} value={horario} disabled={dataEntregaISO === dataHojeISO && horario < dataAtualFormatadaISO.slice(11, 16)}>{horario}</option>)}
            </select></label>
          </div><button className="role-primary-button" type="submit" disabled={creatingActivity}>{creatingActivity ? 'Publicando…' : '＋ Publicar atividade'}</button>
        </form> : <div className="role-empty-state"><span className="role-empty-icon">＋</span><strong>Crie uma turma para começar</strong><p>As atividades são vinculadas a uma turma. Cadastre uma turma antes de lançar tarefas.</p><button className="role-secondary-button" type="button" onClick={() => goToTab('turmas')}>Ir para Minhas Turmas</button></div>}
        {activities.length > 0 && <div className="role-list role-activities-list"><div className="role-list-heading"><h3>Atividades lançadas</h3><span>{activities.length} no total</span></div>{activities.map((item) => <article className="role-list-item" key={item.id}><span className="role-card-icon role-icon-teal" aria-hidden="true">✎</span><div><strong>{item.title}</strong><small>{item.class_name}{item.due_date ? ` · Entrega: ${formatDatePtBr(item.due_date)}` : ' · Sem data de entrega'}</small></div><span className="role-badge">Publicada</span></article>)}</div>}
      </section>
    }

    return <section className="role-tab-panel" aria-labelledby="relatorios-titulo">
      <header className="role-panel-heading"><div><span className="role-kicker">ACOMPANHAMENTO</span><h2 id="relatorios-titulo">Relatórios de desempenho</h2><p>Visão geral do progresso dos alunos por turma.</p></div><span className="role-badge">Resumo</span></header>
      {reportsError && <p className="role-notice" role="alert">{reportsError}</p>}
      {selectedReportClass && <div className="student-modal-backdrop report-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReportClass(null) }}><section className="student-performance-panel report-detail-panel" role="dialog" aria-modal="true" aria-labelledby="report-detail-title"><header className="report-detail-header"><div><span className="role-kicker">RELATORIO DA TURMA</span><h2 id="report-detail-title">{selectedReportClass.name}</h2></div><button className="student-modal-close" type="button" aria-label="Fechar relatorio" onClick={() => setSelectedReportClass(null)}><X size={20} /></button></header><section className="report-detail-section"><h3>Alunos matriculados</h3>{reportsLoading && !selectedClassReport ? <p className="report-detail-empty">Carregando dados da turma...</p> : selectedClassReport?.students?.length ? <div className="report-detail-list">{selectedClassReport.students.map((student) => <article className="report-detail-row" key={student.id}><span><strong>{student.name}</strong><small>{student.email}</small></span><span className="role-badge">{student.submittedCount} de {student.assignmentCount} entregas</span></article>)}</div> : <p className="report-detail-empty">Nenhum aluno matriculado nesta turma.</p>}</section><section className="report-detail-section"><h3>Atividades postadas</h3>{reportsLoading && !selectedClassReport ? <p className="report-detail-empty">Carregando atividades...</p> : selectedClassReport?.assignments?.length ? <div className="report-detail-list">{selectedClassReport.assignments.map((assignment) => <article className="report-detail-row" key={assignment.id}><span><strong>{assignment.title}</strong><small>{assignment.dueDate ? `Prazo: ${formatDatePtBr(assignment.dueDate)}` : 'Sem prazo de entrega'}</small></span><span className="role-badge">{assignment.submittedCount} de {assignment.studentCount} entregas</span></article>)}</div> : <p className="report-detail-empty">Nenhuma atividade publicada nesta turma.</p>}</section></section></div>}
      <div className="role-report-metrics"><article><span>Turmas acompanhadas</span><strong>{classes.length}</strong></article><article><span>Alunos avaliados</span><strong>{reportsLoading ? '…' : reports.evaluatedStudentCount}</strong></article><article><span>Desempenho médio · entregas</span><strong>{reportsLoading ? '…' : reports.averagePerformance === null ? 'Sem notas' : `${reports.averagePerformance}%`}</strong></article></div>
      {classes.length ? <div className="role-list">{classes.map((item) => {
        const classReport = reports.classes.find((report) => report.id === item.id)
        const assignmentCount = classReport?.assignmentCount || 0
        const submittedCount = classReport?.submittedCount || 0
        const status = !assignmentCount ? 'Sem atividades' : !submittedCount ? 'Aguardando entregas' : `${submittedCount} ${submittedCount === 1 ? 'entrega' : 'entregas'}`
        return <article className="role-list-item report-class-card" key={item.id} tabIndex={0} role="button" aria-label={`Ver relatório detalhado da turma ${item.name}`} onClick={() => setSelectedReportClass({ ...item, report: classReport })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedReportClass({ ...item, report: classReport }) } }}><span className="role-card-icon" aria-hidden="true">↗</span><div><strong>{item.name}</strong><small>{item.student_count || 0} alunos · {assignmentCount} atividades · {submittedCount} entregas</small></div><span className="role-badge">{reportsLoading ? 'Atualizando' : status}</span></article>
      })}</div> : <div className="role-empty-state"><span className="role-empty-icon">↗</span><strong>Relatórios aparecerão aqui</strong><p>Crie uma turma e registre atividades para acompanhar o desempenho dos alunos.</p><button className="role-secondary-button" type="button" onClick={() => goToTab('turmas')}>Criar uma turma</button></div>}
    </section>
  }

  return <><RoleDashboard role="TEACHER" title="Área do Professor" eyebrow="SEU ESPAÇO DE ENSINO" subtitle="Acompanhe suas turmas e organize sua rotina docente." navigation={navigation} renderContent={renderContent} onTabChange={(tab) => { if (tab === 'relatorios') carregarRelatorios() }} />{selectedStudent && <div className="student-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStudent(null) }}><section className="student-performance-panel" role="dialog" aria-modal="true" aria-labelledby="student-performance-title"><button className="student-modal-close" type="button" aria-label="Fechar" onClick={() => setSelectedStudent(null)}>×</button><span className="role-kicker">DESEMPENHO DO ALUNO · {selectedStudent.classItem.name}</span><h2 id="student-performance-title">{selectedStudent.name}</h2><p className="student-email">{selectedStudent.email}</p>{studentLoading ? <p>Carregando histórico…</p> : studentError ? <p role="alert">{studentError}</p> : studentPerformance && <><div className="student-summary"><strong>{studentPerformance.completed_count}/{studentPerformance.assignment_count}</strong><span>Atividades concluídas</span></div><h3>Histórico de atividades</h3><div className="student-assignment-list">{studentPerformance.assignments.length ? studentPerformance.assignments.map((assignment) => { const status = assignment.status === 'SUBMITTED' ? 'completed' : assignment.overdue ? 'overdue' : 'pending'; return <article className="student-assignment" key={assignment.id}><div><strong>{assignment.title}</strong><small>{assignment.due_date ? `Prazo: ${formatarDataAluno(assignment.due_date)}` : 'Sem prazo definido'}</small>{assignment.submitted_at && <small>Entregue em {formatarDataAluno(assignment.submitted_at)}</small>}</div><span className={`student-status ${status}`}>{status === 'completed' ? 'Concluída' : status === 'overdue' ? 'Atrasada' : 'Pendente'}</span></article> }) : <p>Nenhuma atividade lançada para esta turma.</p>}</div></>}</section></div>}</>
}

export default DashboardProfessor
