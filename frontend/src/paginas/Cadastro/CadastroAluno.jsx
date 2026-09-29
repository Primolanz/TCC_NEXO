import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../paginasCSS/Login.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'
import CampoSenha from '../../componentes/CampoSenha.jsx'

function CadastroAluno() {
  const navegar = useNavigate()
  const [senha, definirSenha] = useState('')
  const [confirmarSenha, definirConfirmarSenha] = useState('')
  const senhasDiferentes = confirmarSenha.length > 0 && senha !== confirmarSenha

  function cadastrarAluno(evento) {
    evento.preventDefault()
    if (senha !== confirmarSenha) return
    navegar('/cadastro/aluno/confirmar-email')
  }

  return (
    <main className="pagina-login">
      <CabecalhoPagina nomePagina="Criar conta" />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-cadastro-aluno">
          <h1 id="titulo-cadastro-aluno" className="titulo-login">Criar Conta</h1>
          <p className="descricao-login">Preencha os dados abaixo para criar sua conta.</p>

          <nav className="seletor-perfil seletor-perfil-cadastro" aria-label="Tipo de cadastro">
            <Link className="opcao-perfil opcao-perfil-ativa" to="/cadastro/aluno">Sou Aluno</Link>
            <Link className="opcao-perfil" to="/cadastro/professor">Professor</Link>
          </nav>

          <form className="formulario-login" onSubmit={cadastrarAluno}>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="nome-aluno">NOME COMPLETO</label>
              <input className="campo-login" id="nome-aluno" name="nome" type="text" placeholder="Digite aqui seu nome" required />
            </div>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="email-aluno">E-MAIL EDUCACIONAL/PESSOAL</label>
              <input className="campo-login" id="email-aluno" name="email" type="email" placeholder="aluno@email.com" required />
            </div>
            <CampoSenha id="senha-aluno" value={senha} onChange={(evento) => definirSenha(evento.target.value)} />
            <CampoSenha
              id="confirmar-senha-aluno"
              rotulo="CONFIRMAR SENHA DE ACESSO"
              name="confirmarSenha"
              value={confirmarSenha}
              onChange={(evento) => definirConfirmarSenha(evento.target.value)}
              temErro={senhasDiferentes}
              mensagemErro="As senhas precisam ser iguais."
            />
            <button type="submit" className="botao-entrar">Criar conta</button>
          </form>

          <p className="rodape-login">Já tem uma conta?<Link className="link-cadastro" to="/login">Faça login aqui</Link></p>
        </section>
      </div>
    </main>
  )
}

export default CadastroAluno
