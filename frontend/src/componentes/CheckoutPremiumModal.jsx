import { useState } from 'react'
import { apiClient } from '../servicos/apiClient.js'
import '../paginasCSS/CheckoutPremiumModal.css'

function CheckoutPremiumModal({ onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [loading, setLoading] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const pixCode = '00020126580014BR.GOV.BCB.PIX0136nexo-premium-checkout-simulado520400005303986540529.905802BR5910NEXO EDUCACAO6009SAO PAULO62070503***6304ABCD'

  async function confirmPayment(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await apiClient('/user/subscribe-premium', { method: 'POST' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível ativar o plano Premium.')
      const currentUser = (() => {
        try { return JSON.parse(localStorage.getItem('nexo_user') || '{}') } catch { return {} }
      })()
      const updatedUser = { ...currentUser, ...(body.user || {}), plan: 'PREMIUM' }
      localStorage.setItem('nexo_user', JSON.stringify(updatedUser))
      setApproved(true)
      window.setTimeout(() => onSuccess(updatedUser), 900)
    } catch (requestError) {
      setError(requestError.message)
      setLoading(false)
    }
  }

  async function copyPixCode() {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione e copie a chave PIX exibida.')
    }
  }

  return <div className="checkout-premium-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading && !approved) onClose() }}>
    <section className="checkout-premium-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-premium-title">
      {!loading && !approved && <button className="checkout-premium-close" type="button" aria-label="Fechar checkout" onClick={onClose}>×</button>}
      {approved ? <div className="checkout-premium-approved" role="status"><span aria-hidden="true">✓</span><h2>Pagamento Aprovado! 🎉</h2><p>Seu plano Premium já está ativo. Estamos levando você para o início.</p></div> : <>
        <span className="checkout-premium-eyebrow">ASSINATURA NEXO</span>
        <h2 id="checkout-premium-title">Checkout Premium</h2>
        <p className="checkout-premium-intro">Desbloqueie seu plano de estudos personalizado por <strong>R$ 29,90/mês</strong>.</p>
        <div className="checkout-premium-tabs" role="tablist" aria-label="Forma de pagamento">
          <button type="button" role="tab" aria-selected={paymentMethod === 'pix'} className={paymentMethod === 'pix' ? 'active' : ''} onClick={() => setPaymentMethod('pix')}>PIX</button>
          <button type="button" role="tab" aria-selected={paymentMethod === 'card'} className={paymentMethod === 'card' ? 'active' : ''} onClick={() => setPaymentMethod('card')}>Cartão de crédito</button>
        </div>
        <form onSubmit={confirmPayment}>
          {paymentMethod === 'pix' ? <div className="checkout-premium-pix" role="tabpanel">
            <div className="checkout-premium-qr" aria-label="QR Code PIX simulado"><i /><i /><i /><i /></div>
            <p>QR Code e chave demonstrativos para este checkout simulado.</p>
            <label htmlFor="premium-pix-code">PIX copia e cola</label>
            <div className="checkout-premium-copy"><input id="premium-pix-code" readOnly value={pixCode} onFocus={(event) => event.target.select()} /><button type="button" onClick={copyPixCode}>{copied ? 'Copiado!' : 'Copiar'}</button></div>
          </div> : <div className="checkout-premium-card-fields" role="tabpanel">
            <label>Número do cartão<input inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" minLength="12" maxLength="23" required /></label>
            <div><label>Validade<input autoComplete="cc-exp" placeholder="MM/AA" minLength="5" maxLength="5" required /></label><label>CVV<input inputMode="numeric" autoComplete="cc-csc" placeholder="123" minLength="3" maxLength="4" required /></label></div>
            <small>Dados demonstrativos não são enviados nem armazenados.</small>
          </div>}
          {error && <p className="checkout-premium-error" role="alert">{error}</p>}
          <p className="checkout-premium-simulation">Ambiente simulado: nenhuma cobrança real será feita.</p>
          <button className="checkout-premium-confirm" type="submit" disabled={loading}>{loading ? 'Confirmando pagamento…' : 'Confirmar Pagamento'}</button>
        </form>
      </>}
    </section>
  </div>
}

export default CheckoutPremiumModal
