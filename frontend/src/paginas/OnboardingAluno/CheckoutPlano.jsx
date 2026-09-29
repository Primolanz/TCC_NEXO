import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../paginasCSS/OnboardingAluno.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'

function CheckoutPlano() {
  const [periodoSelecionado, definirPeriodoSelecionado] = useState('mensal')
  const [formaPagamento, definirFormaPagamento] = useState('cartao')
  const navegar = useNavigate()

  function finalizarCheckout(evento) {
    evento.preventDefault()
    navegar('/onboarding/aluno')
  }

  return (
    <main className="pagina-checkout-plano">
      <CabecalhoPagina nomePagina="Finalizar assinatura" />

      <section className="conteudo-checkout-plano">
        <Link className="link-voltar-checkout" to="/onboarding/escolher-plano">
          ← Voltar
        </Link>

        <div className="cabecalho-checkout">
          <p className="etapa-onboarding">Passo 2 de 2</p>

          <h1 className="titulo-escolher-plano">
            Finalize sua assinatura
          </h1>

          <p className="descricao-escolher-plano">
            Escolha o período e a forma de pagamento.
          </p>
        </div>

        <div className="layout-checkout">
          <aside className="resumo-plano">
            <h2>Resumo do plano</h2>

            <div className="plano-resumo-destaque">
              <span>Plano escolhido</span>
              <strong>Plano Pago</strong>
              <p>
                {periodoSelecionado === 'mensal'
                  ? 'R$ 29,90 por mês'
                  : 'R$ 287,04 por ano'}
              </p>
            </div>

            <ul className="beneficios-plano">
              <li>Planos de estudos personalizados</li>
              <li>Acesso ilimitado a questões</li>
              <li>Relatórios completos e gráficos</li>
              <li>Conteúdos e simulados exclusivos</li>
            </ul>
          </aside>

          <form className="formulario-checkout" onSubmit={finalizarCheckout}>
            <fieldset className="grupo-checkout">
              <legend>1. Escolha o período</legend>

              <div className="opcoes-periodo">
                <button
                  type="button"
                  className={`opcao-periodo ${
                    periodoSelecionado === 'mensal'
                      ? 'opcao-periodo-ativa'
                      : ''
                  }`}
                  onClick={() => definirPeriodoSelecionado('mensal')}
                >
                  <span>Mensal</span>
                  <strong>R$ 29,90/mês</strong>
                </button>

                <button
                  type="button"
                  className={`opcao-periodo ${
                    periodoSelecionado === 'anual'
                      ? 'opcao-periodo-ativa'
                      : ''
                  }`}
                  onClick={() => definirPeriodoSelecionado('anual')}
                >
                  <span>Anual</span>
                  <strong>R$ 287,04/ano</strong>
                </button>
              </div>
            </fieldset>

            <fieldset className="grupo-checkout">
                <legend>2. Forma de pagamento</legend>

                <div className="opcoes-pagamento">
                    <button
                    type="button"
                    className={`opcao-pagamento ${
                        formaPagamento === 'cartao'
                        ? 'opcao-pagamento-ativa'
                        : ''
                    }`}
                    onClick={() => definirFormaPagamento('cartao')}
                    >
                    Cartão
                    </button>

                    <button
                    type="button"
                    className={`opcao-pagamento ${
                        formaPagamento === 'pix'
                        ? 'opcao-pagamento-ativa'
                        : ''
                    }`}
                    onClick={() => definirFormaPagamento('pix')}
                    >
                    PIX
                    </button>
                </div>

                {formaPagamento === 'cartao' ? (
                    <div className="dados-cartao">
                    <label className="rotulo-campo" htmlFor="numero-cartao">
                        NÚMERO DO CARTÃO
                    </label>

                    <input
                        className="campo-login"
                        id="numero-cartao"
                        inputMode="numeric"
                        placeholder="0000 0000 0000 0000"
                        required
                    />

                    <div className="campos-cartao-menores">
                        <div>
                        <label className="rotulo-campo" htmlFor="validade-cartao">
                            VALIDADE
                        </label>

                        <input
                            className="campo-login"
                            id="validade-cartao"
                            placeholder="MM/AA"
                            required
                        />
                        </div>

                        <div>
                        <label className="rotulo-campo" htmlFor="cvv-cartao">
                            CVV
                        </label>

                        <input
                            className="campo-login"
                            id="cvv-cartao"
                            inputMode="numeric"
                            placeholder="123"
                            required
                        />
                        </div>
                    </div>
                    </div>
                ) : (
                    <div className="area-pix">
                    <div className="codigo-qr-pix" aria-hidden="true">
                        QR
                    </div>

                    <p>
                        Ao finalizar, o código PIX e o QR Code serão gerados para pagamento.
                    </p>
                    </div>
                )}
                </fieldset>

            <button type="submit" className="botao-finalizar-pagamento">
              Finalizar pagamento →
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default CheckoutPlano