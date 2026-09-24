import { Link } from 'react-router-dom'
import '../componentesCSS/CabecalhoPagina.css'

function CabecalhoPagina({ nomePagina }) {
  return (
    <header className="cabecalho-pagina">
      <Link className="logo-cabecalho" to="/" aria-label="Voltar para a página inicial">
        <img className="imagem-logo-cabecalho" src="/NEXO_LOGO.png" alt="NEXO" />
      </Link>
      <p className="nome-pagina-cabecalho">{nomePagina}</p>
    </header>
  )
}

export default CabecalhoPagina
