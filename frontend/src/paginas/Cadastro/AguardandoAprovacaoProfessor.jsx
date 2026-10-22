import { Link, useLocation } from 'react-router-dom'
import '../../paginasCSS/Login.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'

function AguardandoAprovacaoProfessor() {
  const { state } = useLocation()

  return (
    <main className="pagina-login animate-fade-in">
      <CabecalhoPagina nomePagina="Aguardando aprovação" />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-aprovacao">
          <div className="icone-status-aprovacao" aria-hidden="true">◷</div>
          <h1 id="titulo-aprovacao" className="titulo-login">Cadastro em análise</h1>
          <p className="descricao-login">Seu cadastro foi recebido com sucesso.</p>
          <div className="caixa-status-aprovacao">
            <p>{state?.mensagem || 'Sua conta foi criada e está pendente de aprovação pelo administrador. Você poderá acessar a área do professor após a aprovação.'}</p>
          </div>
          <Link className="botao-entrar botao-entrar-link" to="/login/professor">Voltar para o Login</Link>
        </section>
      </div>
    </main>
  )
}

export default AguardandoAprovacaoProfessor
