import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, clearSession } from '../servicos/apiClient.js'
import '../paginasCSS/MenuPerfil.css'

const labelRole = (user = {}) => {
  const role = String(user.role || '').toUpperCase()
  if (role === 'TEACHER') return 'Professor'
  if (role === 'ADMIN') return 'Administrador'
  return String(user.plan || '').toUpperCase() === 'PREMIUM' ? 'Aluno Premium' : 'Aluno Free'
}

function formatarData(value) {
  if (!value) return 'Data não informada'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data não informada' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date)
}

export default function MenuPerfil({ user = {}, role: roleProp = 'STUDENT' }) {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState(user)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const role = String(profile.role || user.role || roleProp).toUpperCase()
  const loginPath = role === 'TEACHER' ? '/login/professor' : role === 'ADMIN' ? '/login/administrador' : '/login'
  const initial = String(profile.name || user.name || profile.email || user.email || '?').trim().charAt(0).toLocaleUpperCase('pt-BR')

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { setOpen(false); setProfileOpen(false) }
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function openProfile() {
    setOpen(false)
    setProfileOpen(true)
    setPasswordError('')
    setPasswordMessage('')
    setLoadingProfile(true)
    try {
      const response = await apiClient('/users/me')
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar seu perfil.')
      const updated = { ...user, ...body.user }
      setProfile(updated)
      localStorage.setItem('nexo_user', JSON.stringify(updated))
    } catch (error) {
      setProfile(user)
      setPasswordError(error.message)
    } finally {
      setLoadingProfile(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (newPassword.length < 8) return setPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
    if (newPassword !== confirmPassword) return setPasswordError('A confirmação não corresponde à nova senha.')
    setPasswordBusy(true)
    try {
      const response = await apiClient('/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, password: newPassword, refresh_token: localStorage.getItem('nexo_refresh_token') || '' }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível alterar a senha.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Senha alterada com sucesso.')
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setPasswordBusy(false)
    }
  }

  async function logout() {
    try {
      await apiClient('/users/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: localStorage.getItem('nexo_refresh_token') || '' }),
      })
    } catch { /* Local logout still completes if the network is unavailable. */ }
    clearSession()
    navigate(loginPath, { replace: true })
  }

  return <div className="menu-perfil" ref={menuRef}>
    <button className="menu-perfil-avatar" type="button" aria-label="Abrir menu do perfil" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{initial}</button>
    {open && <div className="menu-perfil-dropdown" role="menu">
      <div className="menu-perfil-identidade"><strong>{user.name || user.email || 'Minha conta'}</strong><small>{labelRole(user)}</small></div>
      <button type="button" role="menuitem" onClick={openProfile}>Meu Perfil</button>
      <button type="button" role="menuitem" className="menu-perfil-logout" onClick={logout}>Sair (Logout)</button>
    </div>}
    {profileOpen && <div className="perfil-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false) }}>
      <section className="perfil-modal" role="dialog" aria-modal="true" aria-labelledby="perfil-titulo">
        <button className="perfil-fechar" type="button" aria-label="Fechar perfil" onClick={() => setProfileOpen(false)}>×</button>
        <span className="perfil-kicker">SUA CONTA NEXO</span>
        <div className="perfil-identidade-principal"><span className="perfil-avatar-grande" aria-hidden="true">{initial}</span><div><h2 id="perfil-titulo">Meu Perfil</h2><p>Seus dados e configurações de acesso</p></div></div>
        {loadingProfile ? <p className="perfil-status" role="status">Carregando perfil…</p> : <dl className="perfil-dados">
          <div><dt>Nome completo</dt><dd>{profile.name || 'Não informado'}</dd></div>
          <div><dt>E-mail</dt><dd>{profile.email || 'Não informado'}</dd></div>
          <div><dt>Tipo de conta</dt><dd>{labelRole(profile)}</dd></div>
          <div><dt>Membro desde</dt><dd>{formatarData(profile.created_at || profile.createdAt)}</dd></div>
        </dl>}
        <form className="perfil-senha-form" onSubmit={changePassword}>
          <h3>Alterar senha</h3>
          <label>Senha atual<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label>
          <div className="perfil-senha-grid">
            <label>Nova senha<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
            <label>Confirmar nova senha<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
          </div>
          {passwordError && <p className="perfil-feedback erro" role="alert">{passwordError}</p>}
          {passwordMessage && <p className="perfil-feedback sucesso" role="status">{passwordMessage}</p>}
          <button className="perfil-salvar-senha" type="submit" disabled={passwordBusy || loadingProfile}>{passwordBusy ? 'Salvando…' : 'Atualizar senha'}</button>
        </form>
        <button className="perfil-sair" type="button" onClick={logout}>Sair da Conta</button>
      </section>
    </div>}
  </div>
}
