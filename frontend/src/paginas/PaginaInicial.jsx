import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../assets/NEXO_LOGO-sem-fundo.png'
import { apiClient } from '../servicos/apiClient.js'
import '../paginasCSS/PaginaInicial.css'

function PaginaInicial() {
  const navegar = useNavigate()
  const [validandoSessao, setValidandoSessao] = useState(() => Boolean(localStorage.getItem('nexo_token')))

  useEffect(() => {
    if (!localStorage.getItem('nexo_token')) return

    let ativo = true
    apiClient('/dashboard')
      .then((response) => {
        if (response.ok) navegar('/inicio', { replace: true })
      })
      .catch(() => {})
      .finally(() => { if (ativo) setValidandoSessao(false) })
    return () => { ativo = false }
  }, [navegar])

  if (validandoSessao) return <main className="pagina-inicial animate-fade-in" aria-busy="true" />

  return (
    <main className="pagina-inicial animate-fade-in">
      <header className="cabecalho-inicial">
        <Link className="logo-inicial" to="/" aria-label="NEXO: página inicial">
          <img className="imagem-logo-inicial" src={imagemLogoNexo} alt="NEXO" />
        </Link>
        <Link className="botao-login-inicial" to="/login">Login</Link>
      </header>

      <section className="secao-apresentacao">
        <div className="conteudo-apresentacao">
          <p className="frase-apresentacao">Seu caminho, seu foco, seu resultado.</p>
          <h1 className="titulo-pagina-inicial">
            <span>Descubra o que</span>
            <span>você precisa</span>
            <span className="titulo-pagina-inicial-destaque">Aprimorar.</span>
          </h1>
          <p className="descricao-apresentacao">A Nexo analisa seus resultados e orienta seus próximos passos com um plano de estudos personalizado!</p>
          <Link className="botao-criar-conta" to="/cadastro/aluno">
            <span>Criar sua conta</span><span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default PaginaInicial
