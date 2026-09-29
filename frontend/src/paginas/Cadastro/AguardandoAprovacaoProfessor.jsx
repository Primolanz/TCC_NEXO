import { Link } from 'react-router-dom'
import '../../paginasCSS/Login.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'

function AguardandoAprovacaoProfessor() {
  return (
    <main className="pagina-login">
      <CabecalhoPagina nomePagina="Aguardando aprovação" />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-aprovacao">
          <div className="icone-status-aprovacao" aria-hidden="true">◷</div>
          <h1 id="titulo-aprovacao" className="titulo-login">Cadastro em análise</h1>
          <p className="descricao-login">Seu e-mail foi confirmado com sucesso.</p>
          <div className="caixa-status-aprovacao">
            <p>Agora, aguarde a aprovação de um administrador para acessar a área do professor.</p>
          </div>
          <Link className="botao-entrar botao-entrar-link" to="/login/professor">Voltar para o Login</Link>
        </section>
      </div>
    </main>
  )
}

export default AguardandoAprovacaoProfessor
