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

function DashboardAluno() {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
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
    areaPrincipalRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [abaAtiva])

  function sair() {
    clearSession()
    navegar('/', { replace: true })
  }

  function abrirAba(aba) {
    setAbaAtiva(aba)
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
            <p>PLANO DE ESTUDO</p>
            <h1>Planos de estudo</h1>
            {planoFree ? <>
              <p>Seu diagnóstico está salvo. Faça upgrade para desbloquear um plano de estudos personalizado com IA.</p>
              <Link className="dashboard-cta-plano" to="/onboarding/checkout">Conhecer opções de upgrade →</Link>
            </> : <>
              <p>Plano atual: {dados.user?.plan || 'Pro'}</p>
              {dados.study_plan?.summary
                ? <article className="dashboard-plano-resumo">{dados.study_plan.summary}</article>
                : <p>Seu plano de estudos ainda não foi gerado.</p>}
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
