export function friendlyAuthMessage(error, { status, message, code } = {}) {
  const details = `${code || error?.code || ''} ${message || error?.message || ''}`.toLowerCase()
  const responseStatus = status || error?.status

  if (/não foi possível conectar ao servidor|este e-mail já está cadastrado|e-mail ainda não cadastrado|e-mail ou senha incorretos|seu e-mail ainda não foi confirmado|muitas tentativas em pouco tempo|ocorreu um erro ao processar sua solicitação/.test(details)) {
    return message || error?.message
  }

  if (error instanceof TypeError || /failed to fetch|network|fetch failed|connection/.test(details)) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
  }
  if (responseStatus === 429 || /too many requests|rate.?limit|over_request_rate_limit/.test(details)) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'
  }
  if (/23505|user[_ ]already[_ ]exists|already[_ ]registered|already[_ ]exists|email.*(taken|registered|exists|já cadastrado)/.test(details)) {
    return 'Este e-mail já está cadastrado no sistema. Tente fazer login.'
  }
  if (/email_not_found|user_not_found|no user|user does not exist|usuário não encontrado|perfil de usuário não encontrado/.test(details) || responseStatus === 404) {
    return 'E-mail ainda não cadastrado. Verifique o endereço ou crie uma conta.'
  }
  if (/email not confirmed|email_not_confirmed|unconfirmed|e-mail ainda não foi confirmado/.test(details)) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e a pasta de SPAM.'
  }
  if (/invalid login credentials|invalid_credentials|invalid password|credenciais inv.{0,3}lidas|senha incorreta/.test(details)) {
    return 'E-mail ou senha incorretos. Tente novamente.'
  }
  return 'Ocorreu um erro ao processar sua solicitação. Tente novamente em instantes.'
}

export async function readAuthResponse(response) {
  const raw = await response.text()
  let data = {}
  if (raw) {
    try { data = JSON.parse(raw) } catch { /* Mapped to a friendly fallback below. */ }
  }
  if (!response.ok) {
    const message = data.message || data.error || data.msg || ''
    throw new Error(friendlyAuthMessage(null, { status: response.status, message, code: data.code }))
  }
  return data
}
