import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../../assets/NEXO_LOGO-sem-fundo.png'
import '../../paginasCSS/OnboardingAluno.css'

function SobreVoceAluno() {
  const [dataNascimento, definirDataNascimento] = useState('')
  const [ocupacaoAtual, definirOcupacaoAtual] = useState('')
  const [erro, definirErro] = useState('')
  const navegar = useNavigate()

  const formularioPreenchido = dataNascimento && ocupacaoAtual

  function avancarParaObjetivos(evento) {
    evento.preventDefault()

    if (!formularioPreenchido) return

    const [ano, mes, dia] = dataNascimento.split('-').map(Number)
    const nascimento = new Date(ano, mes - 1, dia)
    const hoje = new Date()
    let idade = hoje.getFullYear() - ano
    if (hoje.getMonth() < mes - 1 || (hoje.getMonth() === mes - 1 && hoje.getDate() < dia)) idade -= 1
    const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)
      && nascimento.getFullYear() === ano
      && nascimento.getMonth() === mes - 1
      && nascimento.getDate() === dia
    if (!dataValida || idade < 6 || idade > 120) {
      definirErro('Por favor, insira uma data de nascimento válida (idade entre 6 e 120 anos).')
      return
    }
    definirErro('')

    // Salva os dados no localStorage para uso posterior no diagnóstico
    localStorage.setItem('nexo_onboarding_perfil', JSON.stringify({
      dataNascimento,
      ocupacaoAtual
    }))

    navegar('/onboarding/aluno/objetivos')
  }

  return (
    <main className="pagina-onboarding-aluno animate-fade-in">
      <header className="cabecalho-onboarding">
        <Link className="logo-onboarding" to="/" aria-label="Voltar para a página inicial">
          <img src={imagemLogoNexo} alt="NEXO" />
        </Link>
        <Link className="botao-sair-onboarding" to="/">Sair ↗</Link>
      </header>

      <section className="conteudo-onboarding-aluno">
        <form className="cartao-onboarding" onSubmit={avancarParaObjetivos}>
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
            <p>Conte um pouco sobre a sua situação atual:</p>

            <div className="grupo-campo-onboarding">
              <label htmlFor="data-nascimento">Quantos anos você tem?</label>
              <input
                id="data-nascimento"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={dataNascimento}
                onChange={(e) => { definirDataNascimento(e.target.value); definirErro('') }}
                required
              />
              {erro && <p role="alert" style={{ color: '#f07a7a' }}>{erro}</p>}
            </div>

            <div className="grupo-campo-onboarding">
              <label htmlFor="ocupacao-atual">Qual é a sua ocupação atual?</label>
              <select
                id="ocupacao-atual"
                value={ocupacaoAtual}
                onChange={(e) => definirOcupacaoAtual(e.target.value)}
                required
              >
                <option value="" disabled>Qual é a sua ocupação / ano escolar atual?</option>
                <option value="ensino-fundamental">Ensino Fundamental</option>
                <option value="ensino-medio">Ensino Médio</option>
                <option value="cursinho">Cursinho preparatório</option>
                <option value="universitario">Universitário</option>
                <option value="outro">Outra ocupação</option>
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
