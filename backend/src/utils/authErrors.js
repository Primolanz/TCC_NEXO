const EMAIL_RATE_LIMIT_MESSAGE = 'Atingimos o limite temporário de envio de e-mails da NEXO. Por favor, aguarde alguns minutos e tente novamente mais tarde.';

function isEmailRateLimitError(error) {
  const details = [error?.message, error?.code, error?.name, error?.error_code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return details.includes('email rate limit exceeded') || details.includes('over_email_send_rate_limit');
}

function friendlyAuthError(error, fallback = 'Não foi possível concluir a autenticação agora.') {
  if (isEmailRateLimitError(error)) return EMAIL_RATE_LIMIT_MESSAGE;
  return error?.message || fallback;
}

module.exports = { EMAIL_RATE_LIMIT_MESSAGE, isEmailRateLimitError, friendlyAuthError };
