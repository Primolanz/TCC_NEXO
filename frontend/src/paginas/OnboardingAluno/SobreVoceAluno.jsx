import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../../assets/NEXO_LOGO-sem-fundo.png'
import '../../paginasCSS/OnboardingAluno.css'

function SobreVoceAluno() {
  const [dataNascimento, definirDataNascimento] = useState('')
  const [ocupacaoAtual, definirOcupacaoAtual] = useState('')
  const navegar = useNavigate()

  const formularioPreenchido = dataNascimento && ocupacaoAtual

  function avancarParaObjetivos(evento) {
    evento.preventDefault()

    if (!formularioPreenchido) {
      return
    }

    navegar('/onboarding/aluno/objetivos')
  }

  return (
    <main className="pagina-onboarding-aluno">
      <header className="cabecalho-onboarding">
        <Link
          className="logo-onboarding"
          to="/"
          aria-label="Voltar para a página inicial"
        >
          <img src={imagemLogoNexo} alt="NEXO" />
        </Link>

        <Link className="botao-sair-onboarding" to="/">
          Sair ↗
        </Link>
      </header>

      <section className="conteudo-onboarding-aluno">
        <form
          className="cartao-onboarding"
          onSubmit={avancarParaObjetivos}
        >
          <div className="indicador-etapas-onboarding">
            <div className="etapa-onboarding-item etapa-onboarding-ativa">
              <span className="numero-etapa-onboarding">1</span>
              <span>Sobre você</span>
            </div>

            <div className="linha-etapas-onboarding" />

            <div className="etapa-onboarding-item">
              <span className="numero-etapa-onboarding">2</span>
              <span>Seus objetivos</span>
            </div>

            <div className="linha-etapas-onboarding" />

            <div className="etapa-onboarding-item">
              <span className="numero-etapa-onboarding">3</span>
              <span>Prova Inicial</span>
            </div>
          </div>

          <div className="informacoes-sobre-voce">
            <h1>Vamos começar por você</h1>

            <p>
              Conte um pouco sobre a sua situação atual:
            </p>

            <div className="grupo-campo-onboarding">
              <label htmlFor="data-nascimento">
                Quantos anos você tem?
              </label>

              <input
                id="data-nascimento"
                type="date"
                value={dataNascimento}
                onChange={(evento) =>
                  definirDataNascimento(evento.target.value)
                }
                required
              />
            </div>

            <div className="grupo-campo-onboarding">
              <label htmlFor="ocupacao-atual">
                Qual é a sua ocupação atual?
              </label>

              <select
                id="ocupacao-atual"
                value={ocupacaoAtual}
                onChange={(evento) =>
                  definirOcupacaoAtual(evento.target.value)
                }
                required
              >
                <option value="" disabled>
                  Qual é a sua ocupação / ano escolar atual?
                </option>

                <option value="ensino-fundamental">
                  Ensino Fundamental
                </option>

                <option value="ensino-medio">
                  Ensino Médio
                </option>

                <option value="cursinho">
                  Cursinho preparatório
                </option>

                <option value="universitario">
                  Universitário
                </option>

                <option value="outro">
                  Outra ocupação
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="botao-proximo-onboarding"
              disabled={!formularioPreenchido}
            >
              Próximo passo →
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default SobreVoceAluno