import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bot, BookOpen, ChartNoAxesCombined, ClipboardList, GraduationCap, LayoutDashboard, Menu, UsersRound, X } from 'lucide-react'
import { apiClient } from '../servicos/apiClient.js'
import '../paginasCSS/DashboardAluno.css'
import CheckoutPremiumModal from '../componentes/CheckoutPremiumModal.jsx'
import MenuPerfil from '../componentes/MenuPerfil.jsx'
import MarcaNexo from '../componentes/MarcaNexo.jsx'
import TutorNexo from '../componentes/TutorNexo.jsx'

const ABAS = [
  { id: 'inicio', label: 'Início', icon: <LayoutDashboard /> },
  { id: 'turmas', label: 'Minhas turmas', icon: <UsersRound /> },
  { id: 'atividades', label: 'Atividades', icon: <ClipboardList /> },
  { id: 'resultados', label: 'Meus resultados', icon: <ChartNoAxesCombined /> },
  { id: 'planos', label: 'Planos de estudo', icon: <BookOpen /> },
  { id: 'evolucao', label: 'Evolução', icon: <GraduationCap /> },
  { id: 'tutor', label: 'NEXO', icon: <Bot /> },
]

function parseJsonValue(value) {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text) return value
  try {
    return JSON.parse(text)
  } catch {
    return value
  }
}

function cleanPlanText(value) {
  return String(value || '').replace(/[*_`#]/g, '').replace(/^\s*(?:[-•>]\s*)+/, '').trim()
}

function parseScheduleText(value) {
  const text = cleanPlanText(value)
  const blocks = text.split(/(?=^\s*(?:[-•]\s*)?Dia\s*\d+\b)/im).filter(Boolean)
  const schedule = blocks.flatMap((block) => {
    const lines = block.split(/\r?\n/).map(cleanPlanText).filter(Boolean)
    if (!lines.length || !/^Dia\s*\d+/i.test(lines[0])) return []

    const dayHeader = lines[0].match(/^(Dia\s*\d+)(?:\s*[-–—:：]\s*(.*))?$/i)
    let day = dayHeader?.[1] || lines[0]
    const details = lines.slice(1)
    if (dayHeader?.[2]) {
      const headerRemainder = dayHeader[2].trim()
      const [dayName, inlineDetails] = headerRemainder.split(/\s*[:：]\s*/, 2)
      if (/segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo|monday|tuesday|wednesday|thursday|friday/i.test(dayName)) {
        day = `${day} — ${dayName}`
        if (inlineDetails) details.unshift(inlineDetails)
      } else {
        details.unshift(headerRemainder)
      }
    }
    const item = { day, subject: '', topic: '', goal: '', youtube_query: '' }

    for (const line of details) {
      const youtube = line.match(/(?:pesquisar\s+no\s+youtube|busca(?:r)?\s+no\s+youtube|youtube)\s*[:：-]\s*(.+)/i)
      const goal = line.match(/(?:objetivo(?:\s+do\s+dia)?|meta(?:\s+do\s+dia)?)\s*[:：-]\s*(.+)/i)
      const subject = line.match(/(?:mat[eé]ria|disciplina)\s*[:：-]\s*(.+)/i)
      const topic = line.match(/(?:t[oó]pico|conte[uú]do)\s*[:：-]\s*(.+)/i)

      if (youtube) item.youtube_query = youtube[1].trim()
      else if (goal) item.goal = goal[1].trim()
      else if (subject) item.subject = subject[1].trim()
      else if (topic) item.topic = topic[1].trim()
      else if (!item.topic) {
        const [possibleSubject, ...topicParts] = line.split(/\s+[—–-]\s+|:\s*/)
        if (topicParts.length) {
          item.subject = possibleSubject.trim()
          item.topic = topicParts.join(' — ').trim()
        } else item.topic = line
      } else if (!item.goal) item.goal = line
    }

    return [{ ...item, topic: item.topic || 'Estudo do dia' }]
  })

  const firstDayIndex = text.search(/^\s*(?:[-•]\s*)?Dia\s*\d+\b/im)
  return {
    overview: firstDayIndex > 0 ? text.slice(0, firstDayIndex).trim() : '',
    schedule,
  }
}

function normalizeSchedule(value) {
  const parsed = parseJsonValue(value)
  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => {
      if (typeof item === 'string') return parseScheduleText(item).schedule
      if (!item || typeof item !== 'object') return []
      return [{
        day: item.day || item.day_name || item.dia || 'Dia de estudo',
        subject: item.subject || item.materia || item.discipline || '',
        topic: item.topic || item.topico || item.titulo || 'Estudo do dia',
        goal: item.goal || item.objective || item.objetivo || item.meta || '',
        youtube_query: item.youtube_query || item.youtubeSearch || item.youtube || item.search_term || '',
      }]
    })
  }
  if (typeof parsed === 'string') return parseScheduleText(parsed).schedule
  if (parsed && typeof parsed === 'object') {
    if (parsed.schedule || parsed.days || parsed.cronograma) {
      return normalizeSchedule(parsed.schedule || parsed.days || parsed.cronograma)
    }
    return Object.entries(parsed).flatMap(([day, item]) => {
      if (typeof item === 'string') {
        const parsedDay = parseScheduleText(`${day}\n${item}`).schedule
        return parsedDay.length ? parsedDay : [{ day, subject: '', topic: item, goal: '', youtube_query: '' }]
      }
      if (item && typeof item === 'object') return normalizeSchedule([{ day, ...item }])
      return []
    })
  }
  return []
}

function normalizeStudyPlan(value) {
  const parsed = parseJsonValue(value)
  const plan = parsed && typeof parsed === 'object' && parsed.plan ? parseJsonValue(parsed.plan) : parsed
  if (typeof plan === 'string') {
    const parsedText = parseScheduleText(plan)
    const focus = parsedText.overview.match(/(?:foco(?:\s+da\s+semana|\s+semanal)?|weekly\s+focus)\s*[:：-]\s*(.+)/i)
    const summary = focus
      ? parsedText.overview.replace(focus[0], '').trim()
      : parsedText.overview
    return { summary, weeklyFocus: focus?.[1]?.trim() || '', schedule: parsedText.schedule }
  }
  if (!plan || typeof plan !== 'object') return { summary: '', weeklyFocus: '', schedule: [] }

  const summary = plan.summary || plan.overview || plan.resumo || plan.content || ''
  const schedule = normalizeSchedule(plan.schedule || plan.days || plan.cronograma || plan.weekly_schedule)
  const summarySchedule = schedule.length ? [] : parseScheduleText(summary)
  return {
    summary: summarySchedule.overview || summary,
    weeklyFocus: plan.weekly_focus || plan.weeklyFocus || plan.focus || plan.foco_semanal || '',
    schedule: schedule.length ? schedule : summarySchedule.schedule,
  }
}

function subjectBadgeClass(subject) {
  const normalized = String(subject).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (normalized.includes('mat')) return 'dashboard-badge-matematica'
  if (normalized.includes('port') || normalized.includes('lingua')) return 'dashboard-badge-portugues'
  return 'dashboard-badge-geral'
}

function performanceBadge(score) {
  if (score === null || score === undefined || score === '') {
    return { label: 'Sem resultado', className: 'dashboard-status-sem-resultado' }
  }
  const value = Number(score)
  if (!Number.isFinite(value)) return { label: 'Sem resultado', className: 'dashboard-status-sem-resultado' }
  if (value < 40) return { label: 'Precisa de Atenção', className: 'dashboard-status-insuficiente' }
  if (value < 70) return { label: 'Regular', className: 'dashboard-status-regular' }
  if (value < 90) return { label: 'Bom Desempenho', className: 'dashboard-status-bom' }
  return { label: 'Excelente', className: 'dashboard-status-excelente' }
}

function formatAssessmentDate(value) {
  if (!value) return 'Data indisponível'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
}

function formatarDataHoraEntrega(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return 'Sem data definida'
  const parts = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo', hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value: partValue }) => [type, partValue]))
  return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`
}

function DashboardAluno() {
  const [dados, setDados] = useState(null)
  const [turmas, setTurmas] = useState([])
  const [atividades, setAtividades] = useState([])
  const [carregandoAtividades, setCarregandoAtividades] = useState(true)
  const [erroAtividades, setErroAtividades] = useState('')
  const [atividadeSelecionada, setAtividadeSelecionada] = useState(null)
  const [enviandoConclusao, setEnviandoConclusao] = useState(false)
  const [erroConclusao, setErroConclusao] = useState('')
  const [codigoTurma, setCodigoTurma] = useState('')
  const [estadoTurmas, setEstadoTurmas] = useState({ loading: true, submitting: false, message: '', error: '' })
  const [erro, setErro] = useState('')
  const [gerandoPlano, setGerandoPlano] = useState(false)
  const [erroPlano, setErroPlano] = useState('')
  const [erroProgressoPlano, setErroProgressoPlano] = useState('')
  const [progressoSalvando, setProgressoSalvando] = useState(null)
  const [topicoEvolucaoSelecionado, setTopicoEvolucaoSelecionado] = useState(null)
  const [planoDiaSelecionado, setPlanoDiaSelecionado] = useState(null)
  const location = useLocation()
  const [abaAtiva, setAbaAtiva] = useState(() => location.state?.openTab || 'inicio')
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [checkoutPremiumOpen, setCheckoutPremiumOpen] = useState(false)
  const navegar = useNavigate()
  const areaPrincipalRef = useRef(null)

  const carregarTurmas = useCallback(async () => {
    const response = await apiClient('/classes/student')
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Não foi possível carregar suas turmas.')
    setTurmas(Array.isArray(body.classes) ? body.classes : [])
    return body.classes || []
  }, [])

  const carregarAtividades = useCallback(async () => {
    const response = await apiClient('/assignments/student')
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Não foi possível carregar suas atividades.')
    setAtividades(Array.isArray(body.assignments) ? body.assignments : [])
  }, [])

  async function entrarNaTurma(event) {
    event.preventDefault()
    setEstadoTurmas((current) => ({ ...current, submitting: true, message: '', error: '' }))
    try {
      const response = await apiClient('/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codigoTurma.trim().toUpperCase() }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível entrar na turma.')
      setCodigoTurma('')
      await carregarTurmas()
      setEstadoTurmas((current) => ({ ...current, message: `Você entrou na turma ${body.class?.name || ''} com sucesso.`, error: '' }))
    } catch (error) {
      setEstadoTurmas((current) => ({ ...current, error: error.message, message: '' }))
    } finally {
      setEstadoTurmas((current) => ({ ...current, submitting: false }))
    }
  }

  async function marcarComoConcluida() {
    if (!atividadeSelecionada || atividadeSelecionada.status === 'SUBMITTED') return
    setEnviandoConclusao(true)
    setErroConclusao('')
    try {
      const response = await apiClient(`/assignments/${atividadeSelecionada.id}/submit`, { method: 'POST' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a atividade.')
      const atualizada = { ...atividadeSelecionada, status: 'SUBMITTED' }
      setAtividadeSelecionada(atualizada)
      setAtividades((current) => current.map((item) => item.id === atualizada.id ? atualizada : item))
    } catch (error) {
      setErroConclusao(error.message)
    } finally {
      setEnviandoConclusao(false)
    }
  }

  useEffect(() => {
    let ativo = true
    apiClient('/dashboard')
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.message || body.error || 'Não foi possível carregar seu dashboard.')
        if (ativo) setDados(body)
      })
      .catch((error) => { if (ativo) setErro(error.message) })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    carregarTurmas()
      .catch((error) => setEstadoTurmas((current) => ({ ...current, error: error.message })))
      .finally(() => setEstadoTurmas((current) => ({ ...current, loading: false })))
  }, [carregarTurmas])

  useEffect(() => {
    if (abaAtiva !== 'atividades') return undefined
    let ativo = true
    const atualizar = () => {
      carregarAtividades()
        .catch((error) => { if (ativo) setErroAtividades(error.message) })
        .finally(() => { if (ativo) setCarregandoAtividades(false) })
    }
    setCarregandoAtividades(true)
    setErroAtividades('')
    atualizar()
    const intervalo = window.setInterval(atualizar, 30000)
    return () => { ativo = false; window.clearInterval(intervalo) }
  }, [abaAtiva, carregarAtividades])

  useEffect(() => {
    if (!atividadeSelecionada) return undefined
    const fecharComEsc = (event) => {
      if (event.key === 'Escape') setAtividadeSelecionada(null)
    }
    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [atividadeSelecionada])

  useEffect(() => {
    areaPrincipalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [abaAtiva])

  useEffect(() => {
    if (!topicoEvolucaoSelecionado && !planoDiaSelecionado) return undefined
    const fecharComEsc = (event) => {
      if (event.key === 'Escape') {
        setTopicoEvolucaoSelecionado(null)
        setPlanoDiaSelecionado(null)
      }
    }
    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [topicoEvolucaoSelecionado, planoDiaSelecionado])

  function abrirAba(aba) {
    setAbaAtiva(aba)
    setMenuMobileAberto(false)
    if (aba === 'tutor') {
      setCarregandoAtividades(true)
      carregarAtividades().catch((error) => setErroAtividades(error.message)).finally(() => setCarregandoAtividades(false))
    }
  }

  async function gerarPlanoEstudos() {
    setGerandoPlano(true)
    setErroPlano('')

    try {
      const response = await apiClient('/study-plans/generate', { method: 'POST' })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.message || body.error || 'Não foi possível gerar seu plano de estudos.')
      }
      setDados((atuais) => ({ ...atuais, study_plan: body.plan, study_plan_progress: [] }))
    } catch (error) {
      setErroPlano(error.message)
    } finally {
      setGerandoPlano(false)
    }
  }

  async function alternarDiaEstudado(dayIndex) {
    if (!dados?.study_plan?.id) return
    const current = (dados.study_plan_progress || []).find((item) => Number(item.day_index) === dayIndex)
    const completed = !current?.completed_at
    setProgressoSalvando(dayIndex)
    setErroProgressoPlano('')
    try {
      const response = await apiClient('/study-plans/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_plan_id: dados.study_plan.id, day_index: dayIndex, completed }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível atualizar seu progresso.')
      setDados((value) => ({
        ...value,
        study_plan_progress: [...(value.study_plan_progress || []).filter((item) => Number(item.day_index) !== dayIndex), body.progress],
      }))
      return true
    } catch (error) {
      setErroProgressoPlano(error.message)
      return false
    } finally {
      setProgressoSalvando(null)
    }
  }

  if (erro) return <main className="dashboard-aluno animate-fade-in"><p className="dashboard-erro">{erro}</p></main>
  if (!dados) return <main className="dashboard-aluno animate-fade-in"><p className="dashboard-carregando">Carregando seu painel...</p></main>

  const materias = [
    { key: 'portuguese', title: 'Português' },
    { key: 'math', title: 'Matemática' },
  ]
  const objetivoId = dados.user?.main_goal || localStorage.getItem('nexo_onboarding_objetivo')
  const objetivo = objetivoId === 'desempenho'
    ? 'Melhorar meu desempenho'
    : objetivoId === 'carreira'
      ? 'Foco em carreira'
      : objetivoId || 'Nenhum objetivo cadastrado'
  const statusGeral = performanceBadge(dados.hasDiagnostic ? dados.overall_average : null)
  const resumoGeral = (
    <article className="dashboard-resumo">
      <header className="dashboard-resumo-cabecalho">
        <div><span>SEU DESEMPENHO</span><h2>Resumo geral</h2></div>
        <span className={'dashboard-status-badge ' + statusGeral.className}>
          {statusGeral.label}
        </span>
      </header>
      <div className="dashboard-dados-resumo">
        <div className="dashboard-metrica">
          <span className="dashboard-icone-metrica dashboard-icone-media" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 19V5m0 14h17M7 15l4-4 3 2 6-7" /></svg>
          </span>
          <span>Média geral</span><strong>{dados.hasDiagnostic ? `${dados.overall_average ?? 0}%` : '—'}</strong>
        </div>
        <div className="dashboard-metrica">
          <span className="dashboard-icone-metrica dashboard-icone-questoes" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
          </span>
          <span>Questões respondidas</span><strong>{dados.total_questions || 0}</strong>
        </div>
        <div className="dashboard-metrica">
          <span className="dashboard-icone-metrica dashboard-icone-acertos" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="m12 12 6-6" /></svg>
          </span>
          <span>Acertos</span><strong>{dados.correct_answers || 0}<small>/{dados.total_questions || 0}</small></strong>
        </div>
      </div>
    </article>
  )

  const cardsMaterias = (
    <div className="dashboard-grade-materias">
      {materias.map(({ key, title }) => {
        const materia = dados.subjects?.[key] || { score: null, status: 'Sem resultado', strengths: [], weaknesses: [] }
        const status = performanceBadge(materia.score)
        const score = Number(materia.score)
        return <article className="dashboard-card-materia" key={key}>
          <div className="dashboard-titulo-materia">
            <h3>{title}</h3>
            <span className={'dashboard-status-badge ' + status.className}>{status.label}</span>
          </div>
          <strong className="dashboard-score">{materia.score !== null && materia.score !== undefined && Number.isFinite(score) ? `${score}%` : '—'}</strong>
          <div className="dashboard-trilha-score"><span style={{ width: `${Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0))}%` }} /></div>
          <p>{materia.feedback || 'Seu resultado aparecerá aqui após concluir a prova diagnóstica.'}</p>
          <h4>Seus pontos fortes</h4>
          <div className="dashboard-tags">
            {materia.strengths?.length ? materia.strengths.map((item) => <span key={item}>{item}</span>) : <span>Sem pontos fortes mapeados</span>}
          </div>
          <h4>Para reforçar</h4>
          <div className="dashboard-tags dashboard-tags-fracos">
            {materia.weaknesses?.length ? materia.weaknesses.map((item) => <span key={item}>{item}</span>) : <span>Sem pontos fracos mapeados</span>}
          </div>
        </article>
      })}
    </div>
  )
  const planoFree = String(dados.user?.plan || 'FREE').toUpperCase() === 'FREE'
  const planoEstudos = normalizeStudyPlan(dados.study_plan)
  const historico = Array.isArray(dados.history) ? dados.history : []
  const avaliacaoAtual = historico[historico.length - 1]
  const avaliacaoInicial = historico.find((item) => item.assessment_type === 'INITIAL')
  const retomadas = historico.filter((item) => item.assessment_type === 'RETAKE')
  const avaliacaoRetomada = retomadas[retomadas.length - 1]
  const topicosRetomada = avaliacaoRetomada?.topics || []
  const progressoItens = dados.study_plan_progress || []
  const cronogramaTutor = planoEstudos.schedule || []
  const atividadesPendentes = atividades.filter((item) => item.status !== 'SUBMITTED')
  const agora = Date.now()
  const tarefasProximas = atividadesPendentes.filter((item) => item.due_date && new Date(item.due_date).getTime() >= agora && new Date(item.due_date).getTime() <= agora + 7 * 24 * 60 * 60 * 1000)
  const diagnosticosTutor = (dados.history || []).filter((item) => ['INITIAL', 'RETAKE'].includes(item.assessment_type)).map((item) => ({
    type: item.assessment_type,
    score: item.overall_average,
    difficulties: Object.values(item.subjects || {}).flatMap((subject) => subject.weaknesses || []),
  }))
  const contextoTutor = {
    name: dados.user?.name,
    pendingActivities: atividadesPendentes.map((item) => ({ title: item.title, dueDate: item.due_date, className: item.class_name })),
    upcomingCount: tarefasProximas.length,
    studyPlan: cronogramaTutor.length ? {
      completed: progressoItens.filter((item) => item.completed_at).length,
      total: cronogramaTutor.length,
      topics: cronogramaTutor.map((item) => item.topic),
    } : null,
    diagnostics: diagnosticosTutor,
  }

  return (
    <main className="dashboard-aluno animate-fade-in">
      {menuMobileAberto && <button className="dashboard-mobile-overlay" type="button" aria-label="Fechar menu" onClick={() => setMenuMobileAberto(false)} />}
      <aside className={`dashboard-sidebar ${menuMobileAberto ? 'mobile-drawer-open' : ''}`}>
        <Link className="dashboard-logo" to="/inicio" aria-label="NEXO início"><MarcaNexo variant="sidebar" /></Link>
        <nav aria-label="Navegação do aluno">
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              className={abaAtiva === aba.id ? 'dashboard-link-ativo' : ''}
              aria-current={abaAtiva === aba.id ? 'page' : undefined}
              onClick={() => abrirAba(aba.id)}
            >
              {aba.icon}<span>{aba.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="dashboard-area-principal" ref={areaPrincipalRef}>
        <header className="dashboard-cabecalho">
          <div className="dashboard-area-aluno-badge">
            <MarcaNexo variant="header" />
            <span><small>ESPAÇO NEXO</small><strong>Área do aluno</strong></span>
          </div>
          <MenuPerfil user={dados.user} role="STUDENT" />
          <button className="dashboard-mobile-menu-button" type="button" aria-label={menuMobileAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuMobileAberto} onClick={() => setMenuMobileAberto((open) => !open)}>{menuMobileAberto ? <X size={21} /> : <Menu size={21} />}</button>
        </header>
        <section className="dashboard-conteudo">
          {abaAtiva === 'tutor' && <TutorNexo isPremium={!planoFree} context={contextoTutor} onPremium={() => setCheckoutPremiumOpen(true)} />}
          {abaAtiva === 'inicio' && <>
            <div className="dashboard-boas-vindas">
              <p>SEU ESPAÇO DE APRENDIZAGEM</p>
              <h1>Olá, {dados.user?.name || 'Aluno'}!</h1>
            </div>
            <article className="dashboard-card-objetivo">
              <span>Seu objetivo</span>
              <strong>{objetivo}</strong>
            </article>
            {!dados.hasDiagnostic && <div className="dashboard-aviso-diagnostico">
              <p>Faça sua prova diagnóstica para descobrir seu desempenho por matéria.</p>
              <Link to="/onboarding/aluno/prova-inicial">Iniciar prova →</Link>
            </div>}
            {resumoGeral}
            <div className="dashboard-atalhos">
              <button type="button" onClick={() => abrirAba('resultados')}>Ver meus resultados →</button>
              <button type="button" onClick={() => abrirAba('planos')}>Planos de estudo →</button>
              <button type="button" onClick={() => abrirAba('evolucao')}>Acompanhar evolução →</button>
            </div>
          </>}

          {abaAtiva === 'turmas' && <section className="dashboard-secao" aria-labelledby="aluno-turmas-titulo">
            <div className="dashboard-titulo-secao"><h1 id="aluno-turmas-titulo">Minhas turmas</h1><span>Acompanhe as turmas em que você está matriculado.</span></div>
            <form className="aluno-entrar-turma" onSubmit={entrarNaTurma}>
              <div><span className="aluno-turmas-kicker">CÓDIGO DE ACESSO</span><h2>Entrar em uma turma</h2><p>Peça o código ao seu professor para se conectar à turma.</p></div>
              <div className="aluno-turma-form-controls"><label htmlFor="codigo-turma">Código da turma</label><div><input id="codigo-turma" value={codigoTurma} onChange={(event) => setCodigoTurma(event.target.value.toUpperCase())} placeholder="NX-XXXX" maxLength={7} autoComplete="off" required /><button type="submit" disabled={estadoTurmas.submitting}>{estadoTurmas.submitting ? 'Entrando…' : 'Entrar na turma'}</button></div></div>
              {estadoTurmas.message && <p className="aluno-turmas-feedback sucesso" role="status">{estadoTurmas.message}</p>}
              {estadoTurmas.error && <p className="aluno-turmas-feedback erro" role="alert">{estadoTurmas.error}</p>}
            </form>
            <div className="aluno-turmas-lista-cabecalho"><h2>Turmas matriculadas</h2><span>{turmas.length} {turmas.length === 1 ? 'turma' : 'turmas'}</span></div>
            {estadoTurmas.loading ? <p className="aluno-turmas-vazio">Carregando suas turmas…</p> : turmas.length ? <div className="aluno-turmas-lista">
              {turmas.map((turma) => <article className="aluno-turma-card" key={turma.id}>
                <span className="aluno-turma-icone" aria-hidden="true">▦</span><div><h3>{turma.name}</h3><p>Professor: {turma.teacher_name}</p><span>{turma.classmate_count} {turma.classmate_count === 1 ? 'colega' : 'colegas'}</span></div><code>{turma.code}</code>
              </article>)}
            </div> : <p className="aluno-turmas-vazio">Você ainda não entrou em nenhuma turma. Insira um código acima para começar.</p>}
          </section>}

          {abaAtiva === 'atividades' && <section className="dashboard-secao" aria-labelledby="aluno-atividades-titulo">
            <div className="dashboard-titulo-secao"><h1 id="aluno-atividades-titulo">Tarefas e atividades</h1><span>Atividades compartilhadas pelos professores das suas turmas.</span></div>
            {erroAtividades && <p className="aluno-turmas-feedback erro" role="alert">{erroAtividades}</p>}
            {carregandoAtividades ? <p className="aluno-turmas-vazio">Carregando atividades…</p> : atividades.length ? <div className="aluno-atividades-lista">
              {atividades.map((atividade) => <article className="aluno-atividade-card" key={atividade.id} role="button" tabIndex={0} aria-haspopup="dialog" onClick={() => { setErroConclusao(''); setAtividadeSelecionada(atividade) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setErroConclusao(''); setAtividadeSelecionada(atividade) } }}>
                <header><div><span className="aluno-turmas-kicker">{atividade.class_name}</span><h2>{atividade.title}</h2></div><span className={`aluno-atividade-status ${atividade.status === 'SUBMITTED' ? 'concluida' : ''}`}>{atividade.status === 'SUBMITTED' ? 'Concluída' : 'Pendente'}</span></header>
                <p className="aluno-atividade-descricao">{atividade.description || 'Sem instruções adicionais.'}</p>
                <footer><span>Data e hora limite</span><strong>{formatarDataHoraEntrega(atividade.due_date)}</strong></footer>
              </article>)}
            </div> : <p className="aluno-turmas-vazio">Não há atividades pendentes nas suas turmas.</p>}
            {atividadeSelecionada && <div className="aluno-atividade-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAtividadeSelecionada(null) }}>
              <section className="aluno-atividade-modal" role="dialog" aria-modal="true" aria-labelledby="atividade-modal-titulo">
          <button className="aluno-atividade-modal-fechar" type="button" aria-label="Voltar" onClick={() => setAtividadeSelecionada(null)}><ArrowLeft size={18} /><span>Voltar</span></button>
                <span className="aluno-turmas-kicker">{atividadeSelecionada.class_name}</span>
                <h2 id="atividade-modal-titulo">{atividadeSelecionada.title}</h2>
                <div className="aluno-atividade-modal-prazo"><span>Data e hora limite</span><strong>{formatarDataHoraEntrega(atividadeSelecionada.due_date)}</strong></div>
                <div className="aluno-atividade-modal-conteudo"><h3>Instruções e conteúdo</h3><p>{atividadeSelecionada.description || 'O professor não adicionou instruções para esta atividade.'}</p></div>
                {erroConclusao && <p className="aluno-turmas-feedback erro" role="alert">{erroConclusao}</p>}
                {atividadeSelecionada.status === 'SUBMITTED'
                  ? <p className="aluno-atividade-concluida-mensagem" role="status">Atividade marcada como concluída.</p>
                  : <button className="aluno-atividade-concluir" type="button" onClick={marcarComoConcluida} disabled={enviandoConclusao}>{enviandoConclusao ? 'Salvando…' : 'Marcar como Concluída'}</button>}
              </section>
            </div>}
          </section>}

          {abaAtiva === 'resultados' && <section className="dashboard-secao">
            <div className="dashboard-titulo-secao"><h1>Meus resultados</h1><span>Desempenho da avaliação mais recente</span></div>
            {cardsMaterias}
            {resumoGeral}
            <button className="dashboard-cta-plano" type="button" onClick={() => navegar('/avaliacao/diagnostica?mode=retake')}>Refazer Questionário de Diagnóstico</button>
          </section>}

          {abaAtiva === 'planos' && <section className="dashboard-aba-plano">
            <header className="dashboard-planos-cabecalho">
              <p>PLANO DE ESTUDO</p>
              <h1>Planos de estudo</h1>
            </header>
            {planoFree ? <>
              <p>Seu diagnóstico está salvo. Conheça o Premium para montar um plano de estudos que combina com seus objetivos.</p>
              <button className="dashboard-cta-plano" type="button" onClick={() => setCheckoutPremiumOpen(true)}>Assinar Premium →</button>
            </> : <>
              <p>Plano atual: {dados.user?.plan || 'PREMIUM'}</p>
              {!dados.hasDiagnostic ? <>
                <p>Conclua sua avaliação diagnóstica para gerar um plano personalizado.</p>
                <Link className="dashboard-cta-plano" to="/avaliacao/diagnostica">Fazer diagnóstico →</Link>
              </> : <>
                {dados.study_plan && <article className="dashboard-foco-semana">
                  <span>FOCO DA SEMANA</span>
                  <h2>{planoEstudos.weeklyFocus || 'Priorize os tópicos indicados em cada dia do cronograma.'}</h2>
                  {planoEstudos.summary && <p>{planoEstudos.summary}</p>}
                </article>}
                {planoEstudos.schedule.length > 0 ? <div className="dashboard-cronograma">
                  {planoEstudos.schedule.map((item, index) => {
                    const estudado = Boolean((dados.study_plan_progress || []).find((progress) => Number(progress.day_index) === index)?.completed_at)
                    return <article className={`dashboard-dia-card ${estudado ? 'dashboard-dia-estudado' : ''}`} key={`${item.day}-${index}`}>
                    <button className="dashboard-dia-conteudo" type="button" onClick={() => setPlanoDiaSelecionado({ item, index, estudado })} aria-label={`Ler conteúdo: ${item.topic}`}>
                      <div className="dashboard-dia-cabecalho">
                        <span className="dashboard-dia-indice">{index + 1}</span>
                        <div>
                          <p>{item.day}</p>
                          <h2>{item.topic}</h2>
                        </div>
                      </div>
                      {item.subject && <span className={`dashboard-materia-badge ${subjectBadgeClass(item.subject)}`}>{item.subject}</span>}
                      {item.goal && <div className="dashboard-dia-meta">
                        <span>OBJETIVO DO DIA</span>
                        <p>{item.goal}</p>
                      </div>}
                      <span className="dashboard-dia-ler-mais">Abrir conteúdo e dicas →</span>
                    </button>
                    {item.youtube_query && <a
                      className="dashboard-youtube-link"
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.youtube_query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
                      </svg>
                      Buscar “{item.youtube_query}” no YouTube
                    </a>}
                    <button className="dashboard-marcar-estudado" type="button" onClick={() => alternarDiaEstudado(index)} disabled={progressoSalvando === index} aria-pressed={estudado}>{progressoSalvando === index ? 'Salvando…' : estudado ? '✓ Conteúdo estudado' : 'Marcar como estudado'}</button>
                  </article>})}
                </div> : <p className="dashboard-plano-vazio">{dados.study_plan ? 'O plano salvo ainda não contém um cronograma diário estruturado.' : 'Seu plano de estudos ainda não foi gerado.'}</p>}
                {erroProgressoPlano && <p className="dashboard-erro-progresso" role="alert">{erroProgressoPlano}</p>}
                {erroPlano && <p role="alert">{erroPlano}</p>}
                <button className="dashboard-cta-plano" type="button" onClick={gerarPlanoEstudos} disabled={gerandoPlano}>
                  {gerandoPlano ? 'Preparando seu plano...' : dados.study_plan ? 'Criar novo plano de estudos' : 'Montar meu plano de estudos'}
                </button>
              </>}
            </>}
          </section>}

          {abaAtiva === 'evolucao' && <section className="dashboard-evolucao-pagina">
            <header className="dashboard-evolucao-cabecalho">
              <div>
                <span>SEU HISTÓRICO DE APRENDIZAGEM</span>
                <h1>Sua evolução</h1>
                <p>Compare seus resultados e acompanhe seu progresso por matéria.</p>
              </div>
              <Link className="dashboard-cta-evolucao" to="/avaliacao/diagnostica?mode=retake">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4.5 15a8 8 0 0 0 14 2M4 17v-5h5m10.5-3a8 8 0 0 0-14-2" /></svg>
                Refazer Questionário de Diagnóstico
              </Link>
            </header>

            <aside className="dashboard-evolucao-explicacao">
              <span className="dashboard-evolucao-info-icone" aria-hidden="true">i</span>
              <p>A evolução é calculada comparando o resultado da avaliação diagnóstica mais recente com a anterior. Cada nova avaliação atualiza este histórico.</p>
            </aside>

            {historico.length > 0 ? <>
              <div className="dashboard-historico-provas">
                {historico.map((prova) => {
                  const statusProva = performanceBadge(prova.overall_average)
                  return <article className="dashboard-historico-card" key={prova.diagnostic_id}>
                    <div><span>{prova.label}</span><small>{formatAssessmentDate(prova.created_at)}</small></div>
                    <strong>{prova.overall_average}%</strong>
                    <span className={'dashboard-status-badge ' + statusProva.className}>{statusProva.label}</span>
                  </article>
                })}
              </div>

              {avaliacaoInicial && avaliacaoRetomada ? <><article className="dashboard-comparacao-geral"><div><span>Pontuação inicial</span><strong>{avaliacaoInicial.overall_average}%</strong></div><b aria-hidden="true">→</b><div><span>Nova pontuação</span><strong>{avaliacaoRetomada.overall_average}%</strong></div></article><section className="dashboard-comparacao-materias">
                <div className="dashboard-comparacao-titulo">
                  <div><span>EVOLUÇÃO APÓS OS ESTUDOS</span><h2>Inicial × Nova pontuação</h2></div>
                  <p>{avaliacaoInicial.label} → {avaliacaoRetomada.label}</p>
                </div>
                {materias.map(({ key, title }) => {
                  const anterior = avaliacaoInicial.subjects?.[key]?.score
                  const atual = avaliacaoRetomada.subjects?.[key]?.score
                  const temComparacao = anterior !== null && anterior !== undefined && atual !== null && atual !== undefined
                  const diferenca = temComparacao ? Number(atual) - Number(anterior) : null
                  return <article className="dashboard-comparacao-linha" key={key}>
                    <div className="dashboard-comparacao-label">
                      <strong>{title}</strong>
                      {temComparacao
                        ? <span className={diferenca > 0 ? 'dashboard-variacao-positiva' : diferenca < 0 ? 'dashboard-variacao-negativa' : 'dashboard-variacao-neutra'}>
                            {diferenca > 0 ? '+' : ''}{diferenca.toFixed(1)} p.p.
                          </span>
                        : <span>Sem dados comparáveis</span>}
                    </div>
                    <div className="dashboard-comparacao-valores">
                      <span>Inicial: {temComparacao ? `${anterior}%` : '—'}</span>
                      <span>Nova: {temComparacao ? `${atual}%` : '—'}</span>
                    </div>
                    <div className="dashboard-comparacao-barras" aria-label={`Comparação de ${title}`}>
                      <span><i className="dashboard-barra-anterior" style={{ width: `${Math.max(0, Math.min(100, Number(anterior) || 0))}%` }} /></span>
                      <span><i className="dashboard-barra-atual" style={{ width: `${Math.max(0, Math.min(100, Number(atual) || 0))}%` }} /></span>
                    </div>
                  </article>
                })}
                <div className="dashboard-legenda-comparacao"><span><i className="dashboard-legenda-anterior" />Avaliação anterior</span><span><i className="dashboard-legenda-atual" />Avaliação recente</span></div>
              </section><section className="dashboard-comparacao-topicos" aria-labelledby="comparacao-topicos-titulo">
                <h3 id="comparacao-topicos-titulo">Evolução por tópico</h3>
                {materias.map(({ key, title }) => {
                  const topicosMateria = topicosRetomada.filter((topicResult) => topicResult.subject === key)
                  if (!topicosMateria.length) return null
                  return <div className="dashboard-topicos-materia" key={key}>
                    <h4>{title}</h4>
                    <div className="dashboard-topicos-grid">{topicosMateria.map((topicResult) => {
                  const normalizeTopic = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
                  const initialTopic = (avaliacaoInicial.topics || []).find((item) => item.subject === topicResult.subject && normalizeTopic(item.topic) === normalizeTopic(topicResult.topic))
                  const subjectLabel = title
                  return <button type="button" className="dashboard-topico-comparacao" key={`${topicResult.subject}-${topicResult.topic}`} onClick={() => setTopicoEvolucaoSelecionado({ ...topicResult, initialScore: initialTopic?.score ?? null, subjectLabel })}>
                    <div><strong>{topicResult.topic}</strong><small>{subjectLabel}</small></div>
                    <span>Inicial: {initialTopic ? `${initialTopic.score}%` : 'Sem base'}</span>
                    <strong className="dashboard-topico-nova-pontuacao">Nova: {topicResult.score}%</strong>
                    <span className="dashboard-topico-barra" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, Number(topicResult.score) || 0))}%` }} /></span>
                  </button>
                    })}</div>
                  </div>
                })}
              </section></> : <div className="dashboard-historico-vazio">
                <strong>Seu histórico está começando</strong>
                <p>Depois de refazer a avaliação, você verá aqui a comparação dos resultados por matéria.</p>
              </div>}
            </> : <div className="dashboard-historico-vazio">
              <strong>Nenhuma avaliação registrada</strong>
              <p>Faça sua primeira avaliação diagnóstica para começar a acompanhar sua evolução.</p>
            </div>}
          </section>}
        </section>
      </div>
      {checkoutPremiumOpen && <CheckoutPremiumModal onClose={() => setCheckoutPremiumOpen(false)} onSuccess={(user) => { setDados((current) => ({ ...current, user: { ...current?.user, ...user, plan: 'PREMIUM' } })); setAbaAtiva('inicio'); setCheckoutPremiumOpen(false); navegar('/inicio', { replace: true }) }} />}
      {topicoEvolucaoSelecionado && <div className="aluno-atividade-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTopicoEvolucaoSelecionado(null) }}>
        <section className="aluno-atividade-modal dashboard-detalhe-modal" role="dialog" aria-modal="true" aria-labelledby="topico-detalhe-titulo">
          <button className="aluno-atividade-modal-fechar" type="button" onClick={() => setTopicoEvolucaoSelecionado(null)} aria-label="Voltar"><ArrowLeft size={18} /><span>Voltar</span></button>
          <span className="dashboard-modal-kicker">EVOLUÇÃO POR TÓPICO · {topicoEvolucaoSelecionado.subjectLabel}</span>
          <h2 id="topico-detalhe-titulo">{topicoEvolucaoSelecionado.topic}</h2>
          <div className="dashboard-topico-metricas">
            <div><span>Pontuação inicial</span><strong>{topicoEvolucaoSelecionado.initialScore === null ? '—' : `${topicoEvolucaoSelecionado.initialScore}%`}</strong></div>
            <div><span>Nova pontuação</span><strong>{topicoEvolucaoSelecionado.score}%</strong></div>
          </div>
          <p className="dashboard-topico-recomendacao">{topicoEvolucaoSelecionado.initialScore === null
            ? `Seu diagnóstico inicial não avaliou ${topicoEvolucaoSelecionado.topic}. Continue praticando para acompanhar seu domínio deste conteúdo.`
            : `Sua pontuação em ${topicoEvolucaoSelecionado.topic} ${Number(topicoEvolucaoSelecionado.score) > Number(topicoEvolucaoSelecionado.initialScore) ? `subiu de ${topicoEvolucaoSelecionado.initialScore}% para ${topicoEvolucaoSelecionado.score}%` : Number(topicoEvolucaoSelecionado.score) < Number(topicoEvolucaoSelecionado.initialScore) ? `foi de ${topicoEvolucaoSelecionado.initialScore}% para ${topicoEvolucaoSelecionado.score}%` : `permaneceu em ${topicoEvolucaoSelecionado.score}%`}. ${Number(topicoEvolucaoSelecionado.score) >= 80 ? 'Você demonstra bom domínio; mantenha a revisão para consolidar o aprendizado.' : 'Recomendamos revisar este conteúdo e praticar exercícios relacionados para avançar.'}`}</p>
          <span className={`dashboard-topico-status ${Number(topicoEvolucaoSelecionado.score) >= 80 ? 'dominado' : Number(topicoEvolucaoSelecionado.score) >= 50 ? 'em-progresso' : 'revisar'}`}>{Number(topicoEvolucaoSelecionado.score) >= 80 ? 'Bom domínio' : Number(topicoEvolucaoSelecionado.score) >= 50 ? 'Em progresso' : 'Revisar conteúdo'}</span>
        </section>
      </div>}
      {planoDiaSelecionado && <div className="aluno-atividade-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlanoDiaSelecionado(null) }}>
        <section className="aluno-atividade-modal dashboard-detalhe-modal" role="dialog" aria-modal="true" aria-labelledby="plano-dia-titulo">
          <button className="aluno-atividade-modal-fechar" type="button" onClick={() => setPlanoDiaSelecionado(null)} aria-label="Voltar"><ArrowLeft size={18} /><span>Voltar</span></button>
          <span className="dashboard-modal-kicker">{planoDiaSelecionado.item.day || `DIA ${planoDiaSelecionado.index + 1}`}</span>
          <h2 id="plano-dia-titulo">{planoDiaSelecionado.item.topic}</h2>
          {planoDiaSelecionado.item.subject && <span className={`dashboard-materia-badge ${subjectBadgeClass(planoDiaSelecionado.item.subject)}`}>{planoDiaSelecionado.item.subject}</span>}
          <div className="aluno-atividade-modal-conteudo"><h3>O que estudar</h3><p>{planoDiaSelecionado.item.goal || `Estude os conceitos fundamentais de ${planoDiaSelecionado.item.topic}, observe exemplos resolvidos e pratique aplicando o conteúdo em exercícios.`}</p></div>
          <div className="aluno-atividade-modal-conteudo dashboard-dica-pratica"><h3>Dica prática</h3><p>{String(planoDiaSelecionado.item.subject || '').toLowerCase().includes('mat') ? 'Resolva os exercícios passo a passo e confira cada cálculo. Ao errar, identifique em qual etapa o raciocínio mudou.' : 'Leia exemplos com atenção, destaque as ideias principais e tente explicar o conceito com suas próprias palavras.'}</p></div>
          {planoDiaSelecionado.item.youtube_query && <a className="dashboard-youtube-link" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(planoDiaSelecionado.item.youtube_query)}`} target="_blank" rel="noopener noreferrer">Buscar “{planoDiaSelecionado.item.youtube_query}” no YouTube</a>}
          <button className="dashboard-marcar-estudado dashboard-modal-marcar" type="button" onClick={async () => { const saved = await alternarDiaEstudado(planoDiaSelecionado.index); if (saved) setPlanoDiaSelecionado((current) => current ? { ...current, estudado: !current.estudado } : null) }} disabled={progressoSalvando === planoDiaSelecionado.index} aria-pressed={planoDiaSelecionado.estudado}>{progressoSalvando === planoDiaSelecionado.index ? 'Salvando…' : planoDiaSelecionado.estudado ? '✓ Conteúdo estudado' : 'Marcar como estudado'}</button>
        </section>
      </div>}
    </main>
  )
}

export default DashboardAluno
