import { Link } from 'react-router-dom'
import CampoSenha from './CampoSenha.jsx'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import '../paginasCSS/Login.css'

const caminhosPorPerfil = {
  aluno: '/login',
  professor: '/login/professor',
  administrador: '/login/administrador',
}

function TelaLogin({ perfilAtivo, titulo, descricao, emailExemplo }) {
  function impedirEnvioFormulario(evento) { evento.preventDefault() }

  return (
    <main className="pagina-login">
      <CabecalhoPagina nomePagina={`Login ${titulo}`} />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-login">
          <h1 id="titulo-login" className="titulo-login">Acessar como {titulo}</h1>
          <p className="descricao-login">{descricao}</p>

          <nav className="seletor-perfil" aria-label="Tipo de acesso">
            {Object.entries(caminhosPorPerfil).map(([perfil, caminho]) => (
              <Link
                key={perfil}
                className={`opcao-perfil ${perfil === perfilAtivo ? 'opcao-perfil-ativa' : ''}`}
                to={caminho}
              >
                {perfil === 'aluno' ? 'Aluno' : perfil === 'professor' ? 'Professor' : 'Administrador'}
              </Link>
            ))}
          </nav>

          <form className="formulario-login" onSubmit={impedirEnvioFormulario}>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor={`email-${perfilAtivo}`}>E-MAIL EDUCACIONAL/PESSOAL</label>
              <input className="campo-login" id={`email-${perfilAtivo}`} name="email" type="email" placeholder={emailExemplo} required />
            </div>
            <CampoSenha id={`senha-${perfilAtivo}`} />
            <button type="submit" className="botao-entrar">Entrar no Sistema</button>
          </form>

          {perfilAtivo === 'aluno' ? (
            <p className="rodape-login">Não tem uma conta?<Link className="link-cadastro" to="/cadastro/aluno">Crie uma aqui</Link></p>
          ) : (
            <p className="rodape-login">Não possui acesso? Fale com o administrador.</p>
          )}
        </section>
      </div>
    </main>
  )
}

export default TelaLogin
