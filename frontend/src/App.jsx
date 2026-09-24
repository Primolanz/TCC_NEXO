import { Navigate, Route, Routes } from 'react-router-dom'
import PaginaInicial from './paginas/PaginaInicial.jsx'
import Login from './paginas/Login/Login.jsx'
import LoginProfessor from './paginas/Login/LoginProfessor.jsx'
import LoginAdministrador from './paginas/Login/LoginAdministrador.jsx'
import CadastroAluno from './paginas/Cadastro/CadastroAluno.jsx'
import CadastroProfessor from './paginas/Cadastro/CadastroProfessor.jsx'
import ConfirmarEmail from './paginas/Cadastro/ConfirmarEmail.jsx'
import AguardandoAprovacaoProfessor from './paginas/Cadastro/AguardandoAprovacaoProfessor.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PaginaInicial />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/professor" element={<LoginProfessor />} />
      <Route path="/login/administrador" element={<LoginAdministrador />} />
      <Route path="/cadastro/aluno" element={<CadastroAluno />} />
      <Route path="/cadastro/professor" element={<CadastroProfessor />} />
      <Route path="/cadastro/aluno/confirmar-email" element={<ConfirmarEmail tipoUsuario="aluno" />} />
      <Route path="/cadastro/professor/confirmar-email" element={<ConfirmarEmail tipoUsuario="professor" />} />
      <Route path="/cadastro/professor/aguardando-aprovacao" element={<AguardandoAprovacaoProfessor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
