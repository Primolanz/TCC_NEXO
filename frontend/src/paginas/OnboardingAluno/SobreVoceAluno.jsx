import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../../assets/NEXO_LOGO-sem-fundo.png'
import '../../paginasCSS/OnboardingAluno.css'
import { apiClient } from '../../servicos/apiClient.js'

function SobreVoceAluno() {
  const [dataNascimento, definirDataNascimento] = useState('')
  const [ocupacaoAtual, definirOcupacaoAtual] = useState('')
  const [erro, definirErro] = useState('')
  const [salvando, definirSalvando] = useState(false)
  const navegar = useNavigate()
  const formularioPreenchido = dataNascimento.length === 10 && ocupacaoAtual

  function mascararData(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 8)
    return digitos.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2')
  }

  async function avancar(evento) {
    evento.preventDefault()
    if (!formularioPreenchido) return
    definirSalvando(true)
    definirErro('')
    try {
      const resposta = await apiClient('/users/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_date: dataNascimento, occupation: ocupacaoAtual }),
      })
      const corpo = await resposta.json()
      if (!resposta.ok) throw new Error(corpo.message || corpo.error || 'Não foi possível salvar seus dados.')
      localStorage.setItem('nexo_onboarding_perfil', JSON.stringify({ dataNascimento, ocupacaoAtual }))
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
        <Link className="logo-onboarding" to="/" aria-label="Voltar para a página inicial"><img src={imagemLogoNexo} alt="NEXO" /></Link>
        <Link className="botao-sair-onboarding" to="/">Sair ↗</Link>
      </header>
      <section className="conteudo-onboarding-aluno">
        <form className="cartao-onboarding" onSubmit={avancar}>
          <div className="indicador-etapas-onboarding">
            <div className="etapa-onboarding-item etapa-onboarding-ativa"><span className="numero-etapa-onboarding">1</span><span>Sobre você</span></div>
            <div className="linha-etapas-onboarding" />
            <div className="etapa-onboarding-item"><span className="numero-etapa-onboarding">2</span><span>Prova Inicial</span></div>
          </div>
          <div className="informacoes-sobre-voce">
            <h1>Vamos começar por você</h1>
            <p>Conte um pouco sobre a sua situação atual:</p>
            <div className="grupo-campo-onboarding">
              <label htmlFor="data-nascimento">Qual é a sua data de nascimento?</label>
              <input id="data-nascimento" type="text" inputMode="numeric" autoComplete="bday" placeholder="DD/MM/AAAA" maxLength={10} value={dataNascimento} onChange={(e) => { definirDataNascimento(mascararData(e.target.value)); definirErro('') }} required />
              {erro && <p role="alert" style={{ color: '#f07a7a' }}>{erro}</p>}
            </div>
            <div className="grupo-campo-onboarding">
              <label htmlFor="ocupacao-atual">Qual é a sua ocupação atual?</label>
              <select id="ocupacao-atual" value={ocupacaoAtual} onChange={(e) => definirOcupacaoAtual(e.target.value)} required>
                <option value="" disabled>Qual é a sua ocupação / ano escolar atual?</option>
                <option value="ensino-fundamental">Ensino Fundamental</option>
                <option value="ensino-medio">Ensino Médio</option>
                <option value="cursinho">Cursinho preparatório</option>
                <option value="universitario">Universitário</option>
                <option value="outro">Outra ocupação</option>
              </select>
            </div>
            <button type="submit" className="botao-proximo-onboarding" disabled={!formularioPreenchido || salvando}>{salvando ? 'Salvando…' : 'Próximo passo →'}</button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default SobreVoceAluno
