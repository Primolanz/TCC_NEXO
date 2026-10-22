import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import imagemLogoNexo from '../assets/NEXO_LOGO-sem-fundo.png'
import '../componentesCSS/CabecalhoPagina.css'

function CabecalhoPagina({ nomePagina, showBack = true }) {
  const navigate = useNavigate()
  const voltar = () => window.history.state?.idx > 0 ? navigate(-1) : navigate('/')
  return (
    <header className="cabecalho-pagina">
      {showBack && <button className="botao-voltar-pagina" type="button" onClick={voltar}><ArrowLeft size={17} />Voltar</button>}
      <Link className="logo-cabecalho" to="/" aria-label="Voltar para a página inicial">
        <img className="imagem-logo-cabecalho" src={imagemLogoNexo} alt="NEXO" />
      </Link>
      <p className="nome-pagina-cabecalho">{nomePagina}</p>
    </header>
  )
}

export default CabecalhoPagina
