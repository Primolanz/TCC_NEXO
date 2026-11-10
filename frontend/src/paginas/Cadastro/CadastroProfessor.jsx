import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../paginasCSS/Login.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'
import CampoSenha from '../../componentes/CampoSenha.jsx'
import { clearSession } from '../../servicos/apiClient.js'
import { friendlyAuthMessage } from '../../servicos/authErrors.js'

const toTitleCase = (str) => {
  const preposicoes = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  return str.toLowerCase().split(' ').filter(Boolean).map((word, index) => {
    if (index !== 0 && preposicoes.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

function CadastroProfessor() {
  const navegar = useNavigate()
  const [senha, definirSenha] = useState('')
  const [nome, definirNome] = useState('')
  const [confirmarSenha, definirConfirmarSenha] = useState('')
  const [erro, definirErro] = useState('')
  const [carregando, definirCarregando] = useState(false)
  const senhasDiferentes = confirmarSenha.length > 0 && senha !== confirmarSenha

  async function cadastrarProfessor(evento) {
    evento.preventDefault()
    definirErro('')
    if (senha !== confirmarSenha) {
      definirErro('As senhas precisam ser iguais.')
      return
    }

    definirCarregando(true)
    const form = new FormData(evento.currentTarget)
    try {
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toTitleCase(nome),
          email: form.get('email'),
          password: senha,
          role: 'TEACHER',
        }),
      })
      const dados = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        let errorMsg = dados.message || dados.error || 'Ocorreu um erro ao processar sua solicitação.'
        const normalizedError = errorMsg.toLowerCase()
        if (normalizedError.includes('error sending confirmation email') || normalizedError.includes('rate limit')) {
          errorMsg = 'Limite de e-mails atingido. Tente novamente mais tarde ou entre em contato com o suporte.'
        }
        definirErro(errorMsg)
        return
      }

      clearSession()
      navegar('/cadastro/confirmar-codigo', {
        state: { email: form.get('email'), role: 'TEACHER', mensagem: dados.message },
        replace: true,
      })
    } catch (falha) {
      definirErro(friendlyAuthMessage(falha))
    } finally {
      definirCarregando(false)
    }
  }

  return (
    <main className="pagina-login animate-fade-in">
      <CabecalhoPagina nomePagina="Criar conta" showBack={false} />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-cadastro-professor">
          <h1 id="titulo-cadastro-professor" className="titulo-login">Criar Conta</h1>
          <p className="descricao-login">Preencha os dados abaixo para criar sua conta.</p>

          <nav className="seletor-perfil seletor-perfil-cadastro" aria-label="Tipo de cadastro">
            <Link className="opcao-perfil" to="/cadastro/aluno">Sou Aluno</Link>
            <Link className="opcao-perfil opcao-perfil-ativa" to="/cadastro/professor">Professor</Link>
          </nav>

          {erro && <div role="alert" className="mensagem-erro-campo">{erro}</div>}

          <form className="formulario-login" onSubmit={cadastrarProfessor}>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="nome-professor">NOME COMPLETO</label>
              <input className="campo-login" id="nome-professor" name="nome" type="text" placeholder="Digite aqui seu nome" value={nome} onChange={(evento) => definirNome(`${toTitleCase(evento.target.value)}${evento.target.value.endsWith(' ') ? ' ' : ''}`)} required />
            </div>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="email-professor">E-MAIL EDUCACIONAL/PESSOAL</label>
              <input className="campo-login" id="email-professor" name="email" type="email" placeholder="professor@email.com" required />
            </div>
            <CampoSenha id="senha-professor" value={senha} onChange={(evento) => definirSenha(evento.target.value)} />
            <CampoSenha
              id="confirmar-senha-professor"
              rotulo="CONFIRMAR SENHA DE ACESSO"
              name="confirmarSenha"
              value={confirmarSenha}
              onChange={(evento) => definirConfirmarSenha(evento.target.value)}
              temErro={senhasDiferentes}
              mensagemErro="As senhas precisam ser iguais."
            />
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="telefone-professor">TELEFONE</label>
              <input className="campo-login" id="telefone-professor" name="telefone" type="tel" placeholder="(00) 00000-0000" required />
            </div>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="formacao-professor">FORMAÇÃO</label>
              <input className="campo-login" id="formacao-professor" name="formacao" type="text" placeholder="Ex.: Licenciatura em Matemática" required />
            </div>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="materia-professor">MATÉRIA</label>
              <input className="campo-login" id="materia-professor" name="materia" type="text" placeholder="Ex.: Matemática" required />
            </div>
            <button type="submit" className="botao-entrar" disabled={carregando || senhasDiferentes}>
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="rodape-login">Já tem uma conta?<Link className="link-cadastro" to="/login/professor">Faça login aqui</Link></p>
        </section>
      </div>
    </main>
  )
}

export default CadastroProfessor
