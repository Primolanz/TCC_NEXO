import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../paginasCSS/AvaliacaoDiagnostica.css'

function ProvaDiagnostica() {
  const [respostaSelecionada, definirRespostaSelecionada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const navegar = useNavigate()

  const questao = {
    numero: 1,
    totalQuestoes: 20,
    materia: 'Português',
    enunciado: 'Qual palavra está escrita corretamente?',
    alternativas: [
      { id: 'a', texto: 'A) Exessão' },
      { id: 'b', texto: 'B) Exceção' },
      { id: 'c', texto: 'C) Excessão' },
      { id: 'd', texto: 'D) Eseção' },
    ],
  }

  const progresso = (questao.numero / questao.totalQuestoes) * 100

  async function finalizarEGerarPlano() {
    setCarregando(true)
    setErro('')

    try {
      // 1. Resgatar token e tratar strings/aspas acidentais
      let token = localStorage.getItem('nexo_token')

      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('Sessão expirada ou inválida. Por favor, faça login novamente.')
      }

      // Remove aspas adicionais caso tenha sido salvo com JSON.stringify por engano
      token = token.replace(/^"(.*)"$/, '$1').trim()

      const perfilRaw = localStorage.getItem('nexo_onboarding_perfil')
      const objetivo = localStorage.getItem('nexo_onboarding_objetivo')
      const perfil = perfilRaw ? JSON.parse(perfilRaw) : {}

      // 2. Preparar payload para a API
      const payload = {
        dataNascimento: perfil.dataNascimento,
        ocupacaoAtual: perfil.ocupacaoAtual,
        objetivo: objetivo,
        respostasDiagnostico: [
          { questaoId: questao.numero, resposta: respostaSelecionada }
        ]
      }

      // 3. Requisitar geração do plano autenticada via Bearer Token
      const resposta = await fetch('http://localhost:3000/api/study-plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.message || dados.error || 'Erro ao processar diagnóstico com a IA.')
      }

      // 4. Limpar o rascunho local e redirecionar
      localStorage.removeItem('nexo_onboarding_perfil')
      localStorage.removeItem('nexo_onboarding_objetivo')
      
      navegar('/')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="pagina-prova-diagnostica">
      <section className="conteudo-prova-diagnostica">
        <div className="progresso-prova">
          <span>
            {questao.numero}/{questao.totalQuestoes}
          </span>

          <div className="area-barra-progresso">
            <span className="titulo-progresso-prova">Progresso</span>

            <div
              className="barra-progresso-prova"
              aria-label={`Progresso da prova: ${progresso}%`}
            >
              <div
                className="preenchimento-progresso-prova"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          <span>{progresso}%</span>
        </div>

        {erro && (
          <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center' }}>
            {erro}
          </div>
        )}

        <section className="cartao-questao-diagnostica">
          <header className="cabecalho-questao-diagnostica">
            <h1>Questão {questao.numero}</h1>
            <span>{questao.materia}</span>
          </header>

          <p className="enunciado-questao">
            {questao.enunciado}
          </p>

          <div className="alternativas-questao">
            {questao.alternativas.map((alternativa) => (
              <button
                key={alternativa.id}
                type="button"
                className={`alternativa-questao ${
                  respostaSelecionada === alternativa.id
                    ? 'alternativa-questao-selecionada'
                    : ''
                }`}
                onClick={() => definirRespostaSelecionada(alternativa.id)}
              >
                {alternativa.texto}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="botao-proxima-questao"
          disabled={!respostaSelecionada || carregando}
          onClick={finalizarEGerarPlano}
        >
          {carregando ? 'Gerando Plano com IA...' : 'Finalizar e Gerar Plano →'}
        </button>
      </section>
    </main>
  )
}

export default ProvaDiagnostica