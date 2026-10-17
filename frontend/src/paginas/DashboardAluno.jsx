import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient, clearSession } from '../servicos/apiClient.js'
import '../paginasCSS/DashboardAluno.css'

const ABAS = [
  { id: 'inicio', label: 'Início' },
  { id: 'resultados', label: 'Meus resultados' },
  { id: 'planos', label: 'Planos de estudo' },
  { id: 'evolucao', label: 'Evolução' },
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

function DashboardAluno() {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [gerandoPlano, setGerandoPlano] = useState(false)
  const [erroPlano, setErroPlano] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('inicio')
  const navegar = useNavigate()
  const areaPrincipalRef = useRef(null)

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
    areaPrincipalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [abaAtiva])

  function sair() {
    clearSession()
    navegar('/', { replace: true })
  }

  function abrirAba(aba) {
    setAbaAtiva(aba)
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
      setDados((atuais) => ({ ...atuais, study_plan: body.plan }))
    } catch (error) {
      setErroPlano(error.message)
    } finally {
      setGerandoPlano(false)
    }
  }

  if (erro) return <main className="dashboard-aluno"><p className="dashboard-erro">{erro}</p></main>
  if (!dados) return <main className="dashboard-aluno"><p className="dashboard-carregando">Carregando seu painel...</p></main>

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
  const resumoGeral = (
    <article className="dashboard-resumo">
      <h2>Resumo geral</h2>
      <div className="dashboard-dados-resumo">
        <div><span>Média geral</span><strong>{dados.overall_average}%</strong></div>
        <div><span>Questões respondidas</span><strong>{dados.total_questions || 0}</strong></div>
        <div><span>Acertos</span><strong>{dados.correct_answers || 0}/{dados.total_questions || 0}</strong></div>
      </div>
    </article>
  )
  const cardsMaterias = (
    <div className="dashboard-grade-materias">
      {materias.map(({ key, title }) => {
        const materia = dados.subjects?.[key] || { score: 0, status: 'Sem resultado', strengths: [], weaknesses: [] }
        return <article className="dashboard-card-materia" key={key}>
          <div className="dashboard-titulo-materia"><h3>{title}</h3><span>{materia.status}</span></div>
          <strong className="dashboard-score">{materia.score}%</strong>
          <div className="dashboard-trilha-score"><span style={{ width: `${Math.max(0, Math.min(100, materia.score))}%` }} /></div>
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

  return (
    <main className="dashboard-aluno">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-logo" to="/inicio">NEXO</Link>
        <nav aria-label="Navegação do aluno">
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              className={abaAtiva === aba.id ? 'dashboard-link-ativo' : ''}
              aria-current={abaAtiva === aba.id ? 'page' : undefined}
              onClick={() => abrirAba(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="dashboard-area-principal" ref={areaPrincipalRef}>
        <header className="dashboard-cabecalho">
          <span>Área do aluno</span>
          <button type="button" onClick={sair}>Sair</button>
        </header>
        <section className="dashboard-conteudo">
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

          {abaAtiva === 'resultados' && <section className="dashboard-secao">
            <div className="dashboard-titulo-secao"><h1>Meus resultados</h1><span>Desempenho da avaliação mais recente</span></div>
            {cardsMaterias}
            {resumoGeral}
          </section>}

          {abaAtiva === 'planos' && <section className="dashboard-aba-plano">
            <header className="dashboard-planos-cabecalho">
              <p>PLANO DE ESTUDO</p>
              <h1>Planos de estudo</h1>
            </header>
            {planoFree ? <>
              <p>Seu diagnóstico está salvo. Faça upgrade para desbloquear um plano de estudos personalizado com IA.</p>
              <Link className="dashboard-cta-plano" to="/onboarding/checkout">Conhecer opções de upgrade →</Link>
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
                  {planoEstudos.schedule.map((item, index) => <article className="dashboard-dia-card" key={`${item.day}-${index}`}>
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
                  </article>)}
                </div> : <p className="dashboard-plano-vazio">{dados.study_plan ? 'O plano salvo ainda não contém um cronograma diário estruturado.' : 'Seu plano de estudos ainda não foi gerado.'}</p>}
                {erroPlano && <p role="alert">{erroPlano}</p>}
                <button className="dashboard-cta-plano" type="button" onClick={gerarPlanoEstudos} disabled={gerandoPlano}>
                  {gerandoPlano ? 'Gerando plano...' : dados.study_plan ? 'Gerar novo plano com IA' : 'Gerar Plano de Estudos com IA'}
                </button>
              </>}
            </>}
          </section>}

          {abaAtiva === 'evolucao' && <section className="dashboard-card-evolucao">
            <div className="dashboard-titulo-secao"><h1>Sua evolução</h1><span>Indicadores calculados a partir da última prova</span></div>
            <div className="dashboard-evolucao-media"><strong>{dados.overall_average}%</strong><span>Média geral</span></div>
            {materias.map(({ key, title }) => {
              const score = dados.subjects?.[key]?.score || 0
              return <div className="dashboard-evolucao-linha" key={key}>
                <span>{title}</span><div className="dashboard-trilha-score"><span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div><strong>{score}%</strong>
              </div>
            })}
          </section>}
        </section>
      </div>
    </main>
  )
}

export default DashboardAluno
