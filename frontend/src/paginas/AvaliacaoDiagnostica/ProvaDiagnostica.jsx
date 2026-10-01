import { useState } from 'react'
import { questoesDiagnosticas } from '../../dados/questoesDiagnosticas.js'
import '../../paginasCSS/AvaliacaoDiagnostica.css'

function ProvaDiagnostica() {
    const [indiceQuestaoAtual, definirIndiceQuestaoAtual] = useState(0)
    const [respostasSelecionadas, definirRespostasSelecionadas] = useState({})

    const questao = questoesDiagnosticas[indiceQuestaoAtual]

    const respostaSelecionada = respostasSelecionadas[questao.id] ?? ''

    const progresso = Math.round(
      ((indiceQuestaoAtual + 1) / questoesDiagnosticas.length) * 100
    )

    function selecionarResposta(idAlternativa) {
      definirRespostasSelecionadas((respostasAnteriores) => ({
        ...respostasAnteriores,
        [questao.id]: idAlternativa,
      }))
    }

    function avancarQuestao() {
      const ultimaQuestao =
        indiceQuestaoAtual === questoesDiagnosticas.length - 1

      if (!respostaSelecionada || ultimaQuestao) {
        return
      }

      definirIndiceQuestaoAtual((indiceAnterior) => indiceAnterior + 1)
    }

    function voltarQuestao() {
      if (indiceQuestaoAtual === 0) {
        return
      }

      definirIndiceQuestaoAtual((indiceAnterior) => indiceAnterior - 1)
    }


  return (
    <main className="pagina-prova-diagnostica">
      <section className="conteudo-prova-diagnostica">
        <div className="progresso-prova">
          <span>
            {questao.id}/{questoesDiagnosticas.length}
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

        <section className="cartao-questao-diagnostica">
          <header className="cabecalho-questao-diagnostica">
            <h1>Questão {questao.id}</h1>
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
                onClick={() => selecionarResposta(alternativa.id)}
              >
                {alternativa.texto}
              </button>
            ))}
          </div>
        </section>

        <div className="navegacao-questoes">
          <button
            type="button"
            className="botao-voltar-questao"
            onClick={voltarQuestao}
            disabled={indiceQuestaoAtual === 0}
          >
            ← Voltar
          </button>

          <button
            type="button"
            className="botao-proxima-questao"
            onClick={avancarQuestao}
            disabled={!respostaSelecionada}
          >
            Próxima questão →
          </button>
        </div>
      </section>
    </main>
  )
}

export default ProvaDiagnostica