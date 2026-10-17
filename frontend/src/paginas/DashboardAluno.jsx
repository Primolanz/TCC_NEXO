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
  const avaliacaoAnterior = historico[historico.length - 2]

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
          <div className="dashboard-area-aluno-badge">
            <span className="dashboard-avatar-aluno" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.7-3.5 3.2-5.4 7.5-5.4s6.8 1.9 7.5 5.4" /></svg>
            </span>
            <span><small>ESPAÇO NEXO</small><strong>Área do aluno</strong></span>
          </div>
          <button className="dashboard-botao-sair" type="button" onClick={sair}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M14 8l4 4-4 4m4-4H9" /></svg>
            Sair
          </button>
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

          {abaAtiva === 'evolucao' && <section className="dashboard-evolucao-pagina">
            <header className="dashboard-evolucao-cabecalho">
              <div>
                <span>SEU HISTÓRICO DE APRENDIZAGEM</span>
                <h1>Sua evolução</h1>
                <p>Compare seus resultados e acompanhe seu progresso por matéria.</p>
              </div>
              <Link className="dashboard-cta-evolucao" to="/avaliacao/diagnostica">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4.5 15a8 8 0 0 0 14 2M4 17v-5h5m10.5-3a8 8 0 0 0-14-2" /></svg>
                Refazer Avaliação Diagnóstica
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

              {avaliacaoAnterior && avaliacaoAtual ? <section className="dashboard-comparacao-materias">
                <div className="dashboard-comparacao-titulo">
                  <div><span>COMPARATIVO</span><h2>Desempenho por matéria</h2></div>
                  <p>{avaliacaoAnterior.label} → {avaliacaoAtual.label}</p>
                </div>
                {materias.map(({ key, title }) => {
                  const anterior = avaliacaoAnterior.subjects?.[key]?.score
                  const atual = avaliacaoAtual.subjects?.[key]?.score
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
                      <span>{avaliacaoAnterior.label}: {temComparacao ? `${anterior}%` : '—'}</span>
                      <span>{avaliacaoAtual.label}: {temComparacao ? `${atual}%` : '—'}</span>
                    </div>
                    <div className="dashboard-comparacao-barras" aria-label={`Comparação de ${title}`}>
                      <span><i className="dashboard-barra-anterior" style={{ width: `${Math.max(0, Math.min(100, Number(anterior) || 0))}%` }} /></span>
                      <span><i className="dashboard-barra-atual" style={{ width: `${Math.max(0, Math.min(100, Number(atual) || 0))}%` }} /></span>
                    </div>
                  </article>
                })}
                <div className="dashboard-legenda-comparacao"><span><i className="dashboard-legenda-anterior" />Avaliação anterior</span><span><i className="dashboard-legenda-atual" />Avaliação recente</span></div>
              </section> : <div className="dashboard-historico-vazio">
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
    </main>
  )
}

export default DashboardAluno
