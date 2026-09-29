import { Link } from 'react-router-dom'
import imagemLogoNexo from '../assets/NEXO_LOGO-sem-fundo.png'
import gifLogoNexo from '../assets/NEXO_GIF.gif'
import '../paginasCSS/PaginaInicial.css'

function PaginaInicial() {
  return (
    <main className="pagina-inicial">
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
        <div className="simbolo-decorativo-nexo" aria-hidden="true">
          <img className="imagem-logo-decorativa" src={gifLogoNexo} alt="" />
        </div>
      </section>
    </main>
  )
}

export default PaginaInicial
