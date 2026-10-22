import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../../assets/NEXO_LOGO-sem-fundo.png'
import '../../paginasCSS/OnboardingAluno.css'
import { apiClient } from '../../servicos/apiClient.js'

function ObjetivosAluno() {
  const [objetivoSelecionado, definirObjetivoSelecionado] = useState('')
  const [salvando, definirSalvando] = useState(false)
  const [erro, definirErro] = useState('')
  const navegar = useNavigate()

  async function avancarParaProvaInicial() {
    if (!objetivoSelecionado) return
    definirSalvando(true)
    definirErro('')
    try {
      const perfil = JSON.parse(localStorage.getItem('nexo_onboarding_perfil') || '{}')
      if (!perfil.dataNascimento || !perfil.ocupacaoAtual) throw new Error('Preencha seus dados de perfil antes de continuar.')
      const nascimento = new Date(`${perfil.dataNascimento}T00:00:00`)
      const idade = Math.floor((Date.now() - nascimento.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      const faixaEtaria = idade < 18 ? 'Menos de 18' : idade < 25 ? '18-24' : idade < 35 ? '25-34' : idade < 45 ? '35-44' : '45 ou mais'
      const response = await apiClient('/users/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age_group: faixaEtaria, occupation: perfil.ocupacaoAtual, main_goal: objetivoSelecionado }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível salvar seu objetivo.')
      localStorage.setItem('nexo_onboarding_objetivo', objetivoSelecionado)
      navegar('/onboarding/aluno/prova-inicial')
    } catch (error) {
      definirErro(error.message)
    } finally {
      definirSalvando(false)
    }
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
            <p>Conte um pouco sobre o que você busca melhorar:</p>

            <div className="lista-objetivos">
              <button
                type="button"
                className={`cartao-objetivo ${objetivoSelecionado === 'desempenho' ? 'cartao-objetivo-selecionado' : ''}`}
                onClick={() => definirObjetivoSelecionado('desempenho')}
              >
                <strong>Melhorar meu desempenho</strong>
                <span>Melhorar minhas notas, criar uma rotina de estudos e me preparar para provas.</span>
              </button>

              <button
                type="button"
                className={`cartao-objetivo ${objetivoSelecionado === 'carreira' ? 'cartao-objetivo-selecionado' : ''}`}
                onClick={() => definirObjetivoSelecionado('carreira')}
              >
                <strong>Foco em carreira</strong>
                <span>Descobrir meus talentos, explorar profissões e entender qual área se encaixa melhor.</span>
              </button>
            </div>

            {erro && <p role="alert" style={{ color: '#f07a7a', textAlign: 'center' }}>{erro}</p>}

            <button
              type="button"
              className="botao-proximo-onboarding botao-proximo-centralizado"
              onClick={avancarParaProvaInicial}
              disabled={!objetivoSelecionado || salvando}
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
