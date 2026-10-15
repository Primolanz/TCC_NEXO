import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../paginasCSS/AvaliacaoDiagnostica.css'
import { apiClient } from '../../servicos/apiClient.js'

const TOTAL_QUESTOES = 20

function ProvaDiagnostica() {
  const [questoes, setQuestoes] = useState([])
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [respostas, setRespostas] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const navegar = useNavigate()

  useEffect(() => {
    let ativo = true
    apiClient('/diagnostics/questions')
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível carregar as questões.')
        if (!Array.isArray(data) || data.length < TOTAL_QUESTOES) {
          throw new Error(`A prova precisa de ${TOTAL_QUESTOES} questões cadastradas.`)
        }
        if (ativo) setQuestoes(data.slice(0, TOTAL_QUESTOES))
      })
      .catch((error) => { if (ativo) setErro(error.message) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const questao = questoes[indiceAtual]
  const respostaAtual = questao ? respostas[questao.id] : ''
  const progresso = useMemo(() => questoes.length ? Math.round(((indiceAtual + 1) / TOTAL_QUESTOES) * 100) : 0, [indiceAtual, questoes.length])
  const opcoes = Array.isArray(questao?.options)
    ? questao.options.map((option, index) => typeof option === 'object'
      ? { id: index, text: option.text ?? option.label ?? option.value ?? JSON.stringify(option) }
      : { id: index, text: `${String.fromCharCode(65 + index)}) ${option}` })
    : Object.entries(questao?.options || {}).map(([label, text], index) => ({ id: index, text: `${label}) ${text}` }))

  async function finalizarProva() {
    setEnviando(true)
    setErro('')
    try {
      const respostasEnviadas = questoes.map((item) => ({
        question_id: item.id,
        selected_option: respostas[item.id],
      }))
      const respostaDiagnostico = await apiClient('/diagnostics/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: respostasEnviadas }),
      })
      const resultado = await respostaDiagnostico.json()
      if (!respostaDiagnostico.ok) throw new Error(resultado.message || resultado.error || 'Erro ao salvar o diagnóstico.')

      if (resultado.canGenerateAIPlan) {
        const respostaPlano = await apiClient('/study-plans/generate', { method: 'POST' })
        const plano = await respostaPlano.json()
        if (!respostaPlano.ok) throw new Error(plano.message || plano.error || 'Diagnóstico salvo, mas não foi possível gerar o plano.')
        resultado.plan = plano.plan
      }

      localStorage.setItem('nexo_diagnostic_result', JSON.stringify(resultado))
      localStorage.removeItem('nexo_onboarding_perfil')
      localStorage.removeItem('nexo_onboarding_objetivo')
      navegar('/avaliacao/resultado', { state: { resultado, etapa: 'confirmacao' } })
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  function avancar() {
    if (indiceAtual < TOTAL_QUESTOES - 1) setIndiceAtual((indice) => indice + 1)
    else finalizarProva()
  }

  return (
    <main className="pagina-prova-diagnostica">
      <section className="conteudo-prova-diagnostica">
        <div className="progresso-prova">
          <span>{questoes.length ? `${indiceAtual + 1}/${TOTAL_QUESTOES}` : `0/${TOTAL_QUESTOES}`}</span>
          <div className="area-barra-progresso">
            <span className="titulo-progresso-prova">Progresso</span>
            <div className="barra-progresso-prova" aria-label={`Progresso da prova: ${progresso}%`}>
              <div className="preenchimento-progresso-prova" style={{ width: `${progresso}%` }} />
            </div>
          </div>
          <span>{progresso}%</span>
        </div>

        {erro && <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center' }}>{erro}</div>}
        {carregando && <p>Carregando questões...</p>}
        {!carregando && questao && (
          <>
            <section className="cartao-questao-diagnostica">
              <header className="cabecalho-questao-diagnostica">
                <h1>Questão {indiceAtual + 1}</h1>
                <span>{questao.subject}</span>
              </header>
              <p className="enunciado-questao">{questao.statement}</p>
              <div className="alternativas-questao">
                {opcoes.map((option) => (
                  <button key={String(option.id)} type="button" className={`alternativa-questao ${respostaAtual === option.id ? 'alternativa-questao-selecionada' : ''}`} onClick={() => setRespostas((anteriores) => ({ ...anteriores, [questao.id]: option.id }))}>
                    {option.text}
                  </button>
                ))}
              </div>
            </section>
            <button type="button" className="botao-proxima-questao" disabled={respostaAtual === undefined || respostaAtual === null || enviando} onClick={avancar}>
              {enviando ? 'Salvando prova...' : indiceAtual < TOTAL_QUESTOES - 1 ? 'Próxima Questão →' : 'Finalizar Prova'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}

export default ProvaDiagnostica
