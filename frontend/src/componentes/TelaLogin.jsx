import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CampoSenha from './CampoSenha.jsx'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import '../paginasCSS/Login.css'

const caminhosPorPerfil = {
  aluno: '/login',
  professor: '/login/professor',
  administrador: '/login/administrador',
}

function TelaLogin({ perfilAtivo, titulo, descricao, emailExemplo }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const navigate = useNavigate()

  async function manipularSubmissao(evento) {
    evento.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      // 1. Chamada para a API Node.js
      const resposta = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.message || dados.error || 'Falha ao realizar login.')
      }

      // 2. Salvar o Token JWT no localStorage
      if (dados.token) {
        localStorage.setItem('nexo_token', dados.token)
        localStorage.setItem('nexo_user', JSON.stringify(dados.user || {}))
      }

      // 3. Redirecionamento após o login
      if (perfilAtivo === 'aluno') {
        navigate('/onboarding/aluno')
      } else {
        navigate('/')
      }

    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

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

          {/* Exibição de mensagem de erro caso o login falhe */}
          {erro && (
            <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>
              {erro}
            </div>
          )}

          <form className="formulario-login" onSubmit={manipularSubmissao}>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor={`email-${perfilAtivo}`}>E-MAIL EDUCACIONAL/PESSOAL</label>
              <input
                className="campo-login"
                id={`email-${perfilAtivo}`}
                name="email"
                type="email"
                placeholder={emailExemplo}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <CampoSenha
              id={`senha-${perfilAtivo}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="botao-entrar" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
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