import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient, clearSession } from '../servicos/apiClient.js'
import MenuPerfil from './MenuPerfil.jsx'
import MarcaNexo from './MarcaNexo.jsx'
import '../paginasCSS/RoleDashboard.css'

function RoleDashboard({ role, title, eyebrow, subtitle, sections = [], metrics = [], navigation, renderContent }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexo_user') || '{}') } catch { return {} }
  })
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('inicio')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    apiClient('/users/me')
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Não foi possível validar sua conta.')
        if (String(body.user?.role || '').toUpperCase() !== role) {
          clearSession()
          navigate('/login', { replace: true })
          return
        }
        if (role === 'TEACHER' && body.user.status_approval !== 'APPROVED') {
          clearSession()
          navigate('/login/professor', { replace: true })
          return
        }
        if (active) {
          setUser(body.user)
          localStorage.setItem('nexo_user', JSON.stringify(body.user))
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [navigate, role])

  return (
    <main className={`dashboard-aluno role-dashboard role-dashboard-${role.toLowerCase()} animate-fade-in`}>
      <aside className="dashboard-sidebar role-sidebar">
        <Link className="role-logo" to={role === 'TEACHER' ? '/professor/dashboard' : '/admin/dashboard'} aria-label="NEXO início">
          <MarcaNexo variant="sidebar" />
        </Link>
        <nav aria-label={`Navegação da ${title}`}>
          {(navigation || sections).map((item) => navigation
            ? <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? 'role-nav-active' : ''}
              aria-current={activeTab === item.id ? 'page' : undefined}
              onClick={() => setActiveTab(item.id)}
            >{item.title}</button>
            : <a key={item.title} href={`#${item.id}`}>{item.title}</a>)}
        </nav>
      </aside>

      <div className="dashboard-area-principal role-main">
        <header className="dashboard-cabecalho">
          <div className="dashboard-area-aluno-badge">
            <MarcaNexo variant="header" />
            <span><small>ESPAÇO NEXO</small><strong>{title}</strong></span>
          </div>
          <MenuPerfil user={user} role={role} />
        </header>

        <section className="dashboard-conteudo role-content">
          <div className="dashboard-boas-vindas">
            <p>{eyebrow}</p>
            <h1>Olá, {role === 'TEACHER' ? 'Professor' : 'Administrador'} {user.name || ''}!</h1>
            <span>{subtitle}</span>
          </div>

          {error && <p className="role-notice" role="alert">{error}</p>}

          {renderContent ? renderContent({ user, activeTab, goToTab: setActiveTab }) : <>
            {metrics.length > 0 && <div className="role-metrics">
              {metrics.map((metric) => <article className="role-card" key={metric.title}>
                <span className="role-card-icon" aria-hidden="true">{metric.icon}</span>
                <p>{metric.title}</p>
                <strong>{metric.value || '—'}</strong>
                <span className="role-badge">{metric.badge}</span>
              </article>)}
            </div>}

            <div className="role-sections">
              {sections.map((section) => <article className="role-feature-card" id={section.id} key={section.title}>
                <div className="role-feature-heading">
                  <span className="role-card-icon" aria-hidden="true">{section.icon}</span>
                  <span className="role-badge">{section.badge || 'Em breve'}</span>
                </div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
                {section.children}
              </article>)}
            </div>
          </>}
        </section>
      </div>
    </main>
  )
}

export default RoleDashboard
