import { useEffect, useMemo, useState } from 'react'
import RoleDashboard from '../componentes/RoleDashboard.jsx'
import { apiClient } from '../servicos/apiClient.js'

const navigation = [
  { id: 'inicio', title: 'Início' },
  { id: 'aprovacoes', title: 'Aprovação de Professores' },
  { id: 'usuarios', title: 'Gestão de Usuários' },
]

function DashboardAdmin() {
  const [overview, setOverview] = useState({ metrics: {}, pendingTeachers: [], users: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    let active = true
    apiClient('/admin/overview')
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Não foi possível carregar os dados administrativos.')
        if (active) setOverview(body)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function decideTeacher(id, status) {
    setUpdatingId(id)
    setError('')
    try {
      const response = await apiClient(`/admin/teachers/${encodeURIComponent(id)}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível atualizar a solicitação.')
      setOverview((current) => ({
        metrics: {
          ...current.metrics,
          pendingTeachers: Math.max(0, current.metrics.pendingTeachers - 1),
          approvedTeachers: current.metrics.approvedTeachers + (status === 'APPROVED' ? 1 : 0),
        },
        pendingTeachers: current.pendingTeachers.filter((teacher) => teacher.id !== id),
        users: current.users.map((user) => user.id === id ? body.user : user),
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingId('')
    }
  }

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return overview.users
    return overview.users.filter((user) => `${user.name || ''} ${user.email || ''}`.toLocaleLowerCase('pt-BR').includes(normalized))
  }, [overview.users, search])

  function renderContent({ activeTab, goToTab }) {
    if (loading) return <div className="admin-loading" aria-live="polite">Carregando dados da plataforma…</div>
    if (activeTab === 'inicio') {
      const cards = [
        { title: 'Total de Alunos', value: overview.metrics.students || 0, badge: 'Contas de aluno', icon: '♙', tone: 'violet' },
        { title: 'Professores Pendentes', value: overview.metrics.pendingTeachers || 0, badge: 'Aguardando análise', icon: '◷', tone: 'amber' },
        { title: 'Professores Aprovados', value: overview.metrics.approvedTeachers || 0, badge: 'Acesso liberado', icon: '✓', tone: 'teal' },
      ]

      return <>
        <div className="role-metrics admin-metrics">
          {cards.map((card) => <article className={`role-card admin-metric-card admin-${card.tone}`} key={card.title}>
            <span className="role-card-icon" aria-hidden="true">{card.icon}</span>
            <p>{card.title}</p><strong>{card.value}</strong><span className="role-badge">{card.badge}</span>
          </article>)}
        </div>
        <section className="role-panel admin-overview-panel">
          <div className="role-panel-heading">
            <div><span className="role-kicker">CENTRAL DE GESTÃO</span><h2>Visão geral da plataforma</h2><p>{overview.metrics.totalUsers || 0} usuários cadastrados no NEXO.</p></div>
            <span className="role-badge">Atualizado agora</span>
          </div>
          <button className="admin-overview-link" type="button" onClick={() => goToTab('aprovacoes')}>
            <span className="role-card-icon" aria-hidden="true">✓</span><span><strong>Revisar solicitações de professores</strong><small>{overview.metrics.pendingTeachers || 0} aguardando sua decisão</small></span><b aria-hidden="true">→</b>
          </button>
        </section>
      </>
    }

    if (activeTab === 'aprovacoes') return <section className="role-tab-panel admin-tab-panel">
      <header className="role-panel-heading">
        <div><span className="role-kicker">ANÁLISE DE CADASTROS</span><h2>Aprovação de Professores</h2><p>Revise as solicitações antes de liberar o acesso à área docente.</p></div>
        <span className="role-badge">{overview.pendingTeachers.length} pendentes</span>
      </header>
      {overview.pendingTeachers.length ? <div className="admin-teacher-list">
        {overview.pendingTeachers.map((teacher) => <article className="admin-teacher-card" key={teacher.id}>
          <span className="admin-teacher-avatar" aria-hidden="true">{(teacher.name || 'P').slice(0, 1).toUpperCase()}</span>
          <div className="admin-teacher-info"><strong>{teacher.name || 'Nome não informado'}</strong><span>{teacher.email}</span><small>Solicitação recebida {teacher.created_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(teacher.created_at)) : ''}</small></div>
          <span className="admin-pending-badge">Em análise</span>
          <div className="admin-teacher-actions">
            <button type="button" className="admin-approve-button" disabled={updatingId === teacher.id} onClick={() => decideTeacher(teacher.id, 'APPROVED')}>{updatingId === teacher.id ? 'Salvando…' : 'Aprovar'}</button>
            <button type="button" className="admin-reject-button" disabled={updatingId === teacher.id} onClick={() => decideTeacher(teacher.id, 'REJECTED')}>Rejeitar</button>
          </div>
        </article>)}
      </div> : <div className="role-empty-state"><span className="role-empty-icon">✓</span><strong>Tudo em dia</strong><p>Não há solicitações pendentes de aprovação.</p></div>}
    </section>

    return <section className="role-tab-panel admin-tab-panel">
      <header className="role-panel-heading">
        <div><span className="role-kicker">CONTAS DA PLATAFORMA</span><h2>Gestão de Usuários</h2><p>Pesquise usuários pelo nome ou endereço de e-mail.</p></div>
        <span className="role-badge">{filteredUsers.length} exibidos</span>
      </header>
      <label className="admin-search">
        <span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou e-mail…" aria-label="Buscar usuários por nome ou e-mail" />
      </label>
      {filteredUsers.length ? <div className="admin-users-list">
        {filteredUsers.map((user) => <article className="admin-user-row" key={user.id}>
          <span className="admin-teacher-avatar" aria-hidden="true">{(user.name || user.email || 'U').slice(0, 1).toUpperCase()}</span>
          <div className="admin-user-main"><strong>{user.name || 'Nome não informado'}</strong><span>{user.email}</span></div>
          <span className={`admin-role-badge admin-role-${String(user.role || '').toLowerCase()}`}>{user.role === 'ADMIN' ? 'Administrador' : user.role === 'TEACHER' ? 'Professor' : 'Aluno'}</span>
          {user.role === 'TEACHER' && <span className={`admin-status-badge admin-status-${String(user.status_approval || 'PENDING').toLowerCase()}`}>{user.status_approval === 'APPROVED' ? 'Aprovado' : user.status_approval === 'REJECTED' ? 'Rejeitado' : 'Pendente'}</span>}
          <button type="button" className="admin-user-action" onClick={() => setSelectedUser(user)}>Ver detalhes</button>
        </article>)}
      </div> : <div className="role-empty-state"><strong>Nenhum usuário encontrado</strong><p>Ajuste a busca e tente novamente.</p></div>}
      {selectedUser && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null) }}>
        <section className="admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title">
          <button type="button" className="admin-modal-close" onClick={() => setSelectedUser(null)} aria-label="Fechar">×</button>
          <span className="role-kicker">PERFIL DA PLATAFORMA</span>
          <h3 id="admin-user-modal-title">{selectedUser.name || 'Nome não informado'}</h3>
          <dl><div><dt>E-mail</dt><dd>{selectedUser.email}</dd></div><div><dt>Perfil</dt><dd>{selectedUser.role}</dd></div>{selectedUser.role === 'TEACHER' && <div><dt>Aprovação</dt><dd>{selectedUser.status_approval || 'PENDING'}</dd></div>}</dl>
          <button type="button" className="role-secondary-button" onClick={() => setSelectedUser(null)}>Fechar detalhes</button>
        </section>
      </div>}
    </section>
  }

  return <>
    <RoleDashboard
      role="ADMIN"
      title="Área do Administrador"
      eyebrow="GESTÃO DA PLATAFORMA"
      subtitle="Acompanhe os indicadores e as solicitações do NEXO."
      navigation={navigation}
      renderContent={renderContent}
    />
    {error && <div className="admin-toast" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Fechar mensagem">×</button></div>}
  </>
}

export default DashboardAdmin
