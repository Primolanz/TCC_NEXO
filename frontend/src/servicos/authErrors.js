const MESSAGES = {
  network: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
  exists: 'Este e-mail já está cadastrado no sistema. Tente fazer login.',
  missing: 'E-mail ainda não cadastrado. Verifique o endereço ou crie uma conta.',
  credentials: 'E-mail ou senha incorretos. Tente novamente.',
  unconfirmed: 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e a pasta de SPAM.',
  rate: 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.',
  fallback: 'Ocorreu um erro ao processar sua solicitação. Tente novamente em instantes.',
}

export function friendlyAuthMessage(error, { status, message, code } = {}) {
  const details = `${code || error?.code || ''} ${message || error?.message || ''}`.toLowerCase()
  const responseStatus = status || error?.status

  for (const friendly of Object.values(MESSAGES)) if (details.includes(friendly.toLowerCase())) return friendly
  if (error instanceof TypeError || /failed to fetch|network|fetch failed|connection|econnrefused|etimedout/.test(details)) return MESSAGES.network
  if (responseStatus === 429 || /too many requests|rate.?limit|over_request_rate_limit/.test(details)) return MESSAGES.rate
  if (/otp_expired|token.*(expired|expirou)|code.*(expired|expirou)/.test(details)) return 'Este código expirou. Solicite um novo código e tente novamente.'
  if (/otp_invalid|invalid.*(otp|token|code)|token.*invalid|code.*invalid/.test(details)) return 'O código informado é inválido. Confira os seis dígitos do e-mail e tente novamente.'
  if (/23505|user[_ ]already[_ ]exists|already[_ ]registered|already[_ ]exists|email.*(taken|registered|exists|já cadastrado)/.test(details)) return MESSAGES.exists
  if (/email_not_found|user_not_found|no user|user does not exist|usuário não encontrado|perfil de usuário não encontrado/.test(details) || responseStatus === 404) return MESSAGES.missing
  if (/email not confirmed|email_not_confirmed|unconfirmed/.test(details)) return MESSAGES.unconfirmed
  if (/invalid login credentials|invalid_credentials|invalid password|credenciais inválidas|senha incorreta/.test(details)) return MESSAGES.credentials
  return MESSAGES.fallback
}

export async function readAuthResponse(response) {
  let data = {}
  try {
    const raw = await response.text()
    if (raw) data = JSON.parse(raw)
  } catch { /* An unreadable response uses the friendly fallback. */ }
  if (!response.ok) {
    throw new Error(friendlyAuthMessage(null, {
      status: response.status,
      message: data.message || data.error || data.msg || '',
      code: data.code,
    }))
  }
  return data
}
