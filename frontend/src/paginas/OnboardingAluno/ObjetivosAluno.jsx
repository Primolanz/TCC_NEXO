import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../../assets/NEXO_LOGO-sem-fundo.png'
import '../../paginasCSS/OnboardingAluno.css'

function ObjetivosAluno() {
  const [objetivoSelecionado, definirObjetivoSelecionado] = useState('')
  const navegar = useNavigate()

  function avancarParaProvaInicial() {
    if (!objetivoSelecionado) {
      return
    }

    navegar('/onboarding/aluno/prova-inicial')
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
        <div className="cartao-onboarding">
          <div className="indicador-etapas-onboarding">
            <div className="etapa-onboarding-item etapa-onboarding-concluida">
              <span className="numero-etapa-onboarding">✓</span>
              <span>Sobre você</span>
            </div>

            <div className="linha-etapas-onboarding linha-etapas-concluida" />

            <div className="etapa-onboarding-item etapa-onboarding-ativa">
              <span className="numero-etapa-onboarding">2</span>
              <span>Seus objetivos</span>
            </div>

            <div className="linha-etapas-onboarding" />

            <div className="etapa-onboarding-item">
              <span className="numero-etapa-onboarding">3</span>
              <span>Prova Inicial</span>
            </div>
          </div>

          <div className="informacoes-objetivos">
            <h1>Vamos para seus objetivos</h1>

            <p>
              Conte um pouco sobre o que você busca melhorar:
            </p>

            <div className="lista-objetivos">
              <button
                type="button"
                className={`cartao-objetivo ${
                  objetivoSelecionado === 'desempenho'
                    ? 'cartao-objetivo-selecionado'
                    : ''
                }`}
                onClick={() =>
                  definirObjetivoSelecionado('desempenho')
                }
              >
                <strong>Melhorar meu desempenho</strong>

                <span>
                  Melhorar minhas notas, criar uma rotina de estudos e me
                  preparar para provas.
                </span>
              </button>

              <button
                type="button"
                className={`cartao-objetivo ${
                  objetivoSelecionado === 'carreira'
                    ? 'cartao-objetivo-selecionado'
                    : ''
                }`}
                onClick={() =>
                  definirObjetivoSelecionado('carreira')
                }
              >
                <strong>Foco em carreira</strong>

                <span>
                  Descobrir meus talentos, explorar profissões e entender qual
                  área se encaixa melhor.
                </span>
              </button>
            </div>

            <button
                type="button"
                className="botao-proximo-onboarding botao-proximo-centralizado"
                onClick={avancarParaProvaInicial}
                disabled={!objetivoSelecionado}
                >
                Próximo passo →
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ObjetivosAluno