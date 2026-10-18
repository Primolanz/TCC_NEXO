import { Navigate, Route, Routes } from 'react-router-dom'
import PaginaInicial from './paginas/PaginaInicial.jsx'
import DashboardAluno from './paginas/DashboardAluno.jsx'
import Login from './paginas/Login/Login.jsx'
import LoginProfessor from './paginas/Login/LoginProfessor.jsx'
import LoginAdministrador from './paginas/Login/LoginAdministrador.jsx'
import CadastroAluno from './paginas/Cadastro/CadastroAluno.jsx'
import CadastroProfessor from './paginas/Cadastro/CadastroProfessor.jsx'
import ConfirmarEmail from './paginas/Cadastro/ConfirmarEmail.jsx'
import AguardandoAprovacaoProfessor from './paginas/Cadastro/AguardandoAprovacaoProfessor.jsx'
import EscolherPlano from './paginas/OnboardingAluno/EscolherPlano.jsx'
import CheckoutPlano from './paginas/OnboardingAluno/CheckoutPlano.jsx'
import SobreVoceAluno from './paginas/OnboardingAluno/SobreVoceAluno.jsx'
import ObjetivosAluno from './paginas/OnboardingAluno/ObjetivosAluno.jsx'
import ProvaInicialAluno from './paginas/OnboardingAluno/ProvaInicialAluno.jsx'
import ProvaDiagnostica from './paginas/AvaliacaoDiagnostica/ProvaDiagnostica.jsx'
import ResultadoDiagnostico from './paginas/AvaliacaoDiagnostica/ResultadoDiagnostico.jsx'
import DashboardProfessor from './paginas/DashboardProfessor.jsx'
import DashboardAdmin from './paginas/DashboardAdmin.jsx'
import { ForgotPassword, UpdatePassword } from './paginas/PasswordFlow.jsx'

const rotaPorPerfil = { STUDENT: '/inicio', TEACHER: '/professor/dashboard', ADMIN: '/admin/dashboard' }

function RotaProtegida({ role, children }) {
  const token = localStorage.getItem('nexo_token')
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('nexo_user') || '{}') } catch { return {} }
  })()
  const userRole = String(user.role || '').toUpperCase()

  if (!token || !userRole) return <Navigate to={role === 'STUDENT' ? '/login' : `/login/${role === 'TEACHER' ? 'professor' : 'administrador'}`} replace />
  if (userRole !== role) return <Navigate to={rotaPorPerfil[userRole] || '/'} replace />
  if (role === 'TEACHER' && user.status_approval !== 'APPROVED') return <Navigate to="/login/professor" replace />
  return children
}

function RotaAutenticada({ children }) {
  const token = localStorage.getItem('nexo_token')
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('nexo_user') || '{}') } catch { return {} }
  })()
  if (!token || !user.role) return <Navigate to="/login" replace />
  if (String(user.role).toUpperCase() === 'TEACHER' && user.status_approval !== 'APPROVED') return <Navigate to="/login/professor" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PaginaInicial />} />
      <Route path="/inicio" element={<RotaProtegida role="STUDENT"><DashboardAluno /></RotaProtegida>} />
      <Route path="/professor/dashboard" element={<RotaProtegida role="TEACHER"><DashboardProfessor /></RotaProtegida>} />
      <Route path="/admin/dashboard" element={<RotaProtegida role="ADMIN"><DashboardAdmin /></RotaProtegida>} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/professor" element={<LoginProfessor />} />
      <Route path="/login/administrador" element={<LoginAdministrador />} />
      <Route path="/recuperar-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha" element={<UpdatePassword recovery />} />
      <Route path="/alterar-senha" element={<RotaAutenticada><UpdatePassword /></RotaAutenticada>} />

      <Route path="/cadastro/aluno" element={<CadastroAluno />} />
      <Route path="/cadastro/professor" element={<CadastroProfessor />} />
      <Route path="/cadastro/aluno/confirmar-email" element={<ConfirmarEmail tipoUsuario="aluno" />} />
      <Route path="/cadastro/professor/confirmar-email" element={<ConfirmarEmail tipoUsuario="professor" />} />
      <Route path="/cadastro/professor/aguardando-aprovacao" element={<AguardandoAprovacaoProfessor />} />

      <Route path="/onboarding/escolher-plano" element={<EscolherPlano />} />
      <Route path="/onboarding/checkout" element={<CheckoutPlano />} />
      <Route path="/onboarding/aluno" element={<SobreVoceAluno />} />
      <Route path="/onboarding/aluno/objetivos" element={<ObjetivosAluno />} />
      <Route path="/onboarding/aluno/prova-inicial" element={<ProvaInicialAluno />} />

      <Route path="/avaliacao/diagnostica" element={<ProvaDiagnostica />} />
      <Route path="/avaliacao/resultado" element={<ResultadoDiagnostico />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
