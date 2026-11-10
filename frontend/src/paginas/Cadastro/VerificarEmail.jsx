import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'
import { apiClient, clearSession } from '../../servicos/apiClient.js'
import { friendlyAuthMessage, readAuthResponse } from '../../servicos/authErrors.js'
import '../../paginasCSS/Login.css'

function VerificarEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [segundos, setSegundos] = useState(60)
  const [enviando, setEnviando] = useState(false)
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    if (segundos <= 0) return undefined
    const timer = window.setTimeout(() => setSegundos((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [segundos])

  async function verificar(event) {
    event.preventDefault()
    if (!email) {
      setErro('Não encontramos o e-mail do cadastro. Volte e crie sua conta novamente.')
      return
    }
    setErro('')
    setVerificando(true)
    try {
      const response = await apiClient('/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: codigo }),
      })
      let payload = {}
      try { payload = await response.json() } catch { /* Use a friendly fallback if the API response is unreadable. */ }
      if (!response.ok) {
        const apiMessage = payload.message || payload.error
        if (apiMessage) {
          const apiError = new Error(apiMessage)
          apiError.isApiMessage = true
          throw apiError
        }
        throw new Error(friendlyAuthMessage(null, { status: response.status }))
      }
      clearSession()
      navigate('/login', { replace: true, state: { successMessage: 'Conta confirmada com sucesso! Faça login para continuar' } })
    } catch (error) {
      setErro(error.isApiMessage ? error.message : friendlyAuthMessage(error))
    } finally {
      setVerificando(false)
    }
  }

  async function reenviar() {
    if (!email || segundos > 0 || enviando) return
    setErro('')
    setEnviando(true)
    try {
      const response = await apiClient('/users/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      await readAuthResponse(response)
      setSegundos(60)
    } catch (error) {
      setErro(friendlyAuthMessage(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="pagina-login animate-fade-in">
      <CabecalhoPagina nomePagina="Confirme seu e-mail" showBack={false} />
      <div className="conteudo-central-login">
        <section className="cartao-login otp-card" aria-labelledby="titulo-verificar-email">
          <span className="otp-icon" aria-hidden="true">✉</span>
          <h1 id="titulo-verificar-email" className="titulo-login">Confirme seu E-mail</h1>
          <p className="descricao-login">Enviamos um código de 6 dígitos para <strong>{email || 'o e-mail informado'}</strong>.</p>

          <div className="otp-warning" role="note">
            <strong>Atenção à caixa de SPAM:</strong> O e-mail de confirmação pode levar alguns instantes para chegar e frequentemente vai para a pasta de <strong>Lixo Eletrônico / SPAM</strong>. Verifique-a antes de reenviar.
          </div>

          {erro && <div className="otp-error" role="alert">{erro}</div>}

          <form className="formulario-login" onSubmit={verificar}>
            <label className="rotulo-campo" htmlFor="codigo-confirmacao">CÓDIGO DE VERIFICAÇÃO</label>
            <input
              className="campo-login otp-input"
              id="codigo-confirmacao"
              name="codigo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
              aria-describedby="otp-instrucao"
              required
            />
            <span id="otp-instrucao" className="otp-hint">Digite os seis números recebidos por e-mail.</span>
            <button type="submit" className="botao-entrar" disabled={verificando || codigo.length !== 6 || !email}>
              {verificando ? 'Verificando...' : 'Verificar Código'}
            </button>
          </form>

          <button type="button" className="otp-resend" onClick={reenviar} disabled={segundos > 0 || enviando || !email}>
            {enviando ? 'Reenviando...' : segundos > 0 ? `Reenviar Código (${segundos}s)` : 'Reenviar Código'}
          </button>
          <p className="rodape-login"><Link className="link-cadastro" to="/login">Voltar para o login</Link></p>
        </section>
      </div>
    </main>
  )
}

export default VerificarEmail
