import { useState } from 'react'
import { Link } from 'react-router-dom'
import CabecalhoPagina from '../componentes/CabecalhoPagina.jsx'
import { clearSession } from '../servicos/apiClient.js'
import '../paginasCSS/PasswordFlow.css'

function recoveryTokens() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  return {
    access_token: hash.get('access_token') || query.get('access_token') || '',
    refresh_token: hash.get('refresh_token') || query.get('refresh_token') || '',
  }
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const response = await fetch('http://localhost:3000/api/users/password/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível solicitar a redefinição.')
      setMessage(body.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="pagina-login password-page animate-fade-in">
    <CabecalhoPagina nomePagina="Recuperar senha" />
    <div className="conteudo-central-login"><section className="cartao-login password-card">
      <span className="password-icon" aria-hidden="true">↻</span>
      <h1 className="titulo-login">Esqueceu sua senha?</h1>
      <p className="descricao-login">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
      {message ? <div className="password-confirmation-card" role="status">
        <span className="password-confirmation-icon" aria-hidden="true">✓</span>
        <strong>E-mail de instruções enviado</strong>
        <p>{message}</p>
        <span className="password-email-hint">Se o e-mail estiver cadastrado, o link chegará em instantes. Verifique também a pasta de spam.</span>
      </div> : <>
      {error && <p className="password-feedback password-error" role="alert">{error}</p>}
      <form className="formulario-login" onSubmit={submit}>
        <div className="grupo-campo"><label className="rotulo-campo" htmlFor="recovery-email">E-MAIL DA CONTA</label><input className="campo-login" id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
        <button className="botao-entrar" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar link de recuperação'}</button>
      </form>
      </>}
      <p className="rodape-login"><Link className="link-cadastro" to="/login">Voltar para o login</Link></p>
    </section></div>
  </main>
}

export function UpdatePassword({ recovery = false }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (password !== confirmation) return setError('As senhas não coincidem.')
    const tokens = recovery ? recoveryTokens() : {
      access_token: localStorage.getItem('nexo_token') || '',
      refresh_token: localStorage.getItem('nexo_refresh_token') || '',
    }
    if (!tokens.access_token || !tokens.refresh_token) {
      return setError('Sua sessão expirou. Solicite um novo link de redefinição.')
    }

    setBusy(true)
    try {
      const response = await fetch('http://localhost:3000/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access_token}` },
        body: JSON.stringify({ password, refresh_token: tokens.refresh_token }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível atualizar a senha.')
      clearSession()
      setComplete(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="pagina-login password-page animate-fade-in">
    <CabecalhoPagina nomePagina={recovery ? 'Redefinir senha' : 'Alterar senha'} />
    <div className="conteudo-central-login"><section className="cartao-login password-card">
      <span className="password-icon" aria-hidden="true">⌑</span>
      <h1 className="titulo-login">{complete ? 'Senha atualizada' : recovery ? 'Crie uma nova senha' : 'Alterar senha'}</h1>
      <p className="descricao-login">{complete ? 'Sua senha foi atualizada. Entre novamente com a nova senha.' : 'Use pelo menos 8 caracteres para proteger sua conta.'}</p>
      {error && <p className="password-feedback password-error" role="alert">{error}</p>}
      {complete ? <Link className="botao-entrar botao-entrar-link" to="/login">Ir para o login</Link> : <form className="formulario-login" onSubmit={submit}>
        <div className="grupo-campo"><label className="rotulo-campo" htmlFor="new-password">NOVA SENHA</label><input className="campo-login" id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength="8" required /></div>
        <div className="grupo-campo"><label className="rotulo-campo" htmlFor="confirm-password">CONFIRMAR NOVA SENHA</label><input className="campo-login" id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength="8" required /></div>
        <button className="botao-entrar" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>}
    </section></div>
  </main>
}
