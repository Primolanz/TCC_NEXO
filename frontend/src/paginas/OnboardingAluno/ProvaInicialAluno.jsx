import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../../assets/NEXO_LOGO-sem-fundo.png'
import '../../paginasCSS/OnboardingAluno.css'

function ProvaInicialAluno() {
  const navegar = useNavigate()

  function iniciarProva() {
    navegar('/avaliacao/diagnostica')
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

            <div className="etapa-onboarding-item etapa-onboarding-concluida">
              <span className="numero-etapa-onboarding">✓</span>
              <span>Seus objetivos</span>
            </div>

            <div className="linha-etapas-onboarding linha-etapas-concluida" />

            <div className="etapa-onboarding-item etapa-onboarding-ativa">
              <span className="numero-etapa-onboarding">3</span>
              <span>Prova Inicial</span>
            </div>
          </div>

          <div className="informacoes-prova-inicial">
            <h1>Vamos para a prova inicial!</h1>

            <p>Hora de testar seus conhecimentos, vamos lá!</p>

            <span className="selo-quantidade-questoes">
              ▤ 20 questões
            </span>

            <button
              type="button"
              className="botao-iniciar-prova"
              onClick={iniciarProva}
            >
              Iniciar Prova
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProvaInicialAluno