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
          {senhaVisivel ? '◉' : '◌'}
        </button>
      </div>
      {temErro && <p id={`${id}-erro`} className="mensagem-erro-campo">{mensagemErro}</p>}
    </div>
  )
}

export default CampoSenha
