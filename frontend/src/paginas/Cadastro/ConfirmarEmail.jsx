import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../paginasCSS/Login.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'
import { saveSession } from '../../servicos/apiClient.js'

function ConfirmarEmail({ tipoUsuario = 'aluno' }) {
  const [emailConfirmado, definirEmailConfirmado] = useState(false)
  const navegar = useNavigate()
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const query = new URLSearchParams(window.location.search)
    const accessToken = hash.get('access_token') || query.get('access_token')
    const refreshToken = hash.get('refresh_token') || query.get('refresh_token')
    if (accessToken) saveSession({ access_token: accessToken, refresh_token: refreshToken })
  }, [])
  const destino = tipoUsuario === 'professor'
    ? '/cadastro/professor/aguardando-aprovacao'
    : '/onboarding/escolher-plano'

  return (
    <main className="pagina-login animate-fade-in">
      <CabecalhoPagina nomePagina="Confirmar e-mail" />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-confirmacao">
          <h1 id="titulo-confirmacao" className="titulo-login">Confira seu e-mail</h1>
          <p className="descricao-login">Enviamos um link de confirmação para o e-mail informado.</p>

          <div className="caixa-confirmacao-email">
            <p className="mensagem-confirmacao-email">Abra sua caixa de entrada, confirme seu e-mail pelo link enviado e volte para continuar.</p>
            <label className="rotulo-confirmacao-email" htmlFor="email-confirmado">
              <input
                id="email-confirmado"
                type="checkbox"
                checked={emailConfirmado}
                onChange={(evento) => definirEmailConfirmado(evento.target.checked)}
              />
              <span>Já confirmei meu e-mail</span>
            </label>
          </div>

          <button type="button" className="botao-entrar" disabled={!emailConfirmado} onClick={() => {
            navegar(tipoUsuario === 'aluno' && !localStorage.getItem('nexo_token') ? '/login' : destino)
          }}>
            Continuar
          </button>
        </section>
      </div>
    </main>
  )
}

export default ConfirmarEmail
