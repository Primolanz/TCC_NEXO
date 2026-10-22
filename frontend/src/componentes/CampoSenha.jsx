import { useState } from 'react'

function CampoSenha({
  id,
  rotulo = 'SENHA DE ACESSO',
  placeholder = '••••••••••••',
  name = 'senha',
  value,
  onChange,
  temErro = false,
  mensagemErro,
}) {
  const [senhaVisivel, definirSenhaVisivel] = useState(false)

  return (
    <div className="grupo-campo">
      <label className="rotulo-campo" htmlFor={id}>{rotulo}</label>
      <div className="area-campo-senha">
        <input
          className={`campo-login ${temErro ? 'campo-login-erro' : ''}`}
          id={id}
          name={name}
          type={senhaVisivel ? 'text' : 'password'}
          placeholder={placeholder}
          required
          value={value}
          onChange={onChange}
          aria-invalid={temErro}
          aria-describedby={temErro ? `${id}-erro` : undefined}
        />
        <button
          type="button"
          className="botao-mostrar-senha"
          onClick={() => definirSenhaVisivel(!senhaVisivel)}
          aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={senhaVisivel}
        >
          {senhaVisivel ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M4 4 20 20" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {temErro && <p id={`${id}-erro`} className="mensagem-erro-campo">{mensagemErro}</p>}
    </div>
  )
}

export default CampoSenha
