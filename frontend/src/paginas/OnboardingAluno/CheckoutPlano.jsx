import { useNavigate } from 'react-router-dom'
import CheckoutPremiumModal from '../../componentes/CheckoutPremiumModal.jsx'

function CheckoutPlano() {
  const navigate = useNavigate()
  return <main className="pagina-checkout-plano animate-fade-in"><CheckoutPremiumModal
    onClose={() => navigate('/onboarding/escolher-plano', { replace: true })}
    onSuccess={() => navigate('/inicio', { replace: true })}
  /></main>
}

export default CheckoutPlano
