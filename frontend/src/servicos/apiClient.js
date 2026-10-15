const API_BASE_URL = 'http://localhost:3000/api'

export function saveSession(session = {}) {
  const accessToken = session.access_token || session.accessToken || session.token
  const refreshToken = session.refresh_token || session.refreshToken

  if (accessToken) localStorage.setItem('nexo_token', accessToken)
  if (refreshToken) localStorage.setItem('nexo_refresh_token', refreshToken)
}

export function clearSession() {
  localStorage.removeItem('nexo_token')
  localStorage.removeItem('nexo_refresh_token')
  localStorage.removeItem('nexo_user')
}

async function renewSession() {
  const refreshToken = localStorage.getItem('nexo_refresh_token')
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_BASE_URL}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!response.ok) return false

    const data = await response.json()
    saveSession(data.session || data)
    return Boolean(localStorage.getItem('nexo_token'))
  } catch {
    return false
  }
}

export async function apiClient(path, options = {}) {
  const send = () => {
    const headers = new Headers(options.headers || {})
    const token = localStorage.getItem('nexo_token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  }

  let response = await send()
  if (response.status === 401 && await renewSession()) response = await send()

  if (response.status === 401) {
    clearSession()
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return response
}
