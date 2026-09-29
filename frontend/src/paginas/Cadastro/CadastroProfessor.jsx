import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../paginasCSS/Login.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'
import CampoSenha from '../../componentes/CampoSenha.jsx'

function CadastroProfessor() {
  const navegar = useNavigate()
  const [senha, definirSenha] = useState('')
  const [confirmarSenha, definirConfirmarSenha] = useState('')
  const senhasDiferentes = confirmarSenha.length > 0 && senha !== confirmarSenha

  function cadastrarProfessor(evento) {
    evento.preventDefault()
    if (senha !== confirmarSenha) return
    navegar('/cadastro/professor/confirmar-email')
  }

  return (
    <main className="pagina-login">
      <CabecalhoPagina nomePagina="Criar conta" />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-cadastro-professor">
          <h1 id="titulo-cadastro-professor" className="titulo-login">Criar Conta</h1>
          <p className="descricao-login">Preencha os dados abaixo para criar sua conta.</p>

          <nav className="seletor-perfil seletor-perfil-cadastro" aria-label="Tipo de cadastro">
            <Link className="opcao-perfil" to="/cadastro/aluno">Sou Aluno</Link>
            <Link className="opcao-perfil opcao-perfil-ativa" to="/cadastro/professor">Professor</Link>
          </nav>

          <form className="formulario-login" onSubmit={cadastrarProfessor}>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="nome-professor">NOME COMPLETO</label>
              <input className="campo-login" id="nome-professor" name="nome" type="text" placeholder="Digite aqui seu nome" required />
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
            <button type="submit" className="botao-entrar">Criar conta</button>
          </form>

          <p className="rodape-login">Já tem uma conta?<Link className="link-cadastro" to="/login/professor">Faça login aqui</Link></p>
        </section>
      </div>
    </main>
  )
}

export default CadastroProfessor
