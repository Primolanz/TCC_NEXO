import TelaLogin from '../../componentes/TelaLogin.jsx'

function LoginAdministrador() {
  return <TelaLogin perfilAtivo="administrador" titulo="Administrador" descricao="Entre com seu e-mail e senha para administrar a plataforma." emailExemplo="administrador@email.com" />
}

export default LoginAdministrador
