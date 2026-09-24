import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../paginasCSS/Login.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'

function ConfirmarEmail({ tipoUsuario = 'aluno' }) {
  const [emailConfirmado, definirEmailConfirmado] = useState(false)
  const navegar = useNavigate()
  const destino = tipoUsuario === 'professor'
    ? '/cadastro/professor/aguardando-aprovacao'
    : '/login'

  return (
    <main className="pagina-login">
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

          <button type="button" className="botao-entrar" disabled={!emailConfirmado} onClick={() => navegar(destino)}>
            Continuar
          </button>
        </section>
      </div>
    </main>
  )
}

export default ConfirmarEmail
