import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import '../../paginasCSS/AvaliacaoDiagnostica.css'

function ResultadoDiagnostico() {
  const { state } = useLocation()
  const navegar = useNavigate()
  const [etapa, setEtapa] = useState(state?.etapa || 'resultado')
  let resultado = state?.resultado
  if (!resultado) {
    try { resultado = JSON.parse(localStorage.getItem('nexo_diagnostic_result') || 'null') } catch { resultado = null }
  }
  if (!resultado) return <Navigate to="/avaliacao/diagnostica" replace />

  if (etapa === 'confirmacao') {
    return (
      <main className="pagina-prova-diagnostica pagina-resultado-diagnostico animate-fade-in">
        <section className="conteudo-prova-diagnostica">
          <article className="cartao-resultado-confirmacao">
            <span className="icone-resultado-confirmacao" aria-hidden="true">✓</span>
            <h1>Questionário concluído!</h1>
            <p>Parabéns! você completou todas as questões. Vamos ver como você foi!</p>
            <button className="botao-resultado-principal" type="button" onClick={() => setEtapa('resultado')}>
              Ver resultados →
            </button>
          </article>
        </section>
      </main>
    )
  }

  const respostas = resultado.results || []
  const normalizarMateria = (materia) => String(materia || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const portugues = respostas.filter((item) => {
    const materia = normalizarMateria(item.subject)
    return materia.includes('portugu') || materia.includes('lingua') || materia.includes('linguagem')
  })
  const matematica = respostas.filter((item) => {
    const materia = normalizarMateria(item.subject)
    return materia.includes('matema') || materia.includes('math')
  })
  const percentual = (itens) => itens.length ? Math.round((itens.filter((item) => item.is_correct).length / itens.length) * 100) : 0
  const mediaGeral = Math.round((percentual(portugues) + percentual(matematica)) / 2)
  const cardMateria = (titulo, itens) => {
    const acertos = itens.filter((item) => item.is_correct).length
    const taxa = percentual(itens)
    const pontosFortes = [...new Set(itens.filter((item) => item.is_correct && item.topic).map((item) => item.topic))]
    return (
      <article className="card-desempenho-materia" key={titulo}>
        <h2>{titulo}</h2>
        <strong className="percentual-desempenho">{taxa}%</strong>
        <p>{acertos} de {itens.length} acertos</p>
        <span className={`classificacao-desempenho ${taxa >= 70 ? 'classificacao-bom' : 'classificacao-regular'}`}>
          {taxa >= 70 ? 'Bom' : 'Regular'}
        </span>
        <h3>Seus pontos fortes</h3>
        <div className="tags-pontos-fortes">
          {pontosFortes.length
            ? pontosFortes.map((topic) => <span key={topic}>{topic}</span>)
            : <span>Continue praticando</span>}
        </div>
      </article>
    )
  }

  return (
    <main className="pagina-prova-diagnostica pagina-resultado-diagnostico animate-fade-in">
      <section className="conteudo-prova-diagnostica">
        <header className="cabecalho-resultados">
          <p>PROVA DIAGNÓSTICA</p>
          <h1>Seus Resultados</h1>
          <span>Confira seu desempenho por matéria.</span>
        </header>

        <div className="grade-desempenho-materias">
          {cardMateria('Português', portugues)}
          {cardMateria('Matemática', matematica)}
        </div>

        <article className="card-resumo-geral">
          <h2>Resumo geral</h2>
          <div className="dados-resumo-geral">
            <div><strong>{mediaGeral}%</strong><span>Média geral</span></div>
            <div><strong>{respostas.length}</strong><span>Questões respondidas</span></div>
            <div><strong>{resultado.correctAnswers}/{resultado.totalQuestions}</strong><span>Acertos</span></div>
          </div>
        </article>

        <button className="botao-resultado-principal" type="button" onClick={() => navegar('/inicio')}>
          Continuar para o início →
        </button>
        <p className="link-voltar-resultados"><Link to="/avaliacao/diagnostica">Refazer prova</Link></p>
      </section>
    </main>
  )
}

export default ResultadoDiagnostico
