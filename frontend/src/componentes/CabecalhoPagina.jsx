import { Link } from 'react-router-dom'
import '../componentesCSS/CabecalhoPagina.css'

function CabecalhoPagina({ nomePagina }) {
  return (
    <header className="cabecalho-pagina">
      <Link className="logo-cabecalho" to="/" aria-label="Voltar para a página inicial">
        <span>N</span>
        <span className="logo-cabecalho-destaque">X</span>
      </Link>
      <p className="nome-pagina-cabecalho">{nomePagina}</p>
    </header>
  )
}

export default CabecalhoPagina
