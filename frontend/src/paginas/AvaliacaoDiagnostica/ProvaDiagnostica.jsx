import { useState } from 'react'
import '../../paginasCSS/AvaliacaoDiagnostica.css'

function ProvaDiagnostica() {
  const [respostaSelecionada, definirRespostaSelecionada] = useState('')

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
          disabled={!respostaSelecionada}
        >
          Próxima questão →
        </button>
      </section>
    </main>
  )
}

export default ProvaDiagnostica