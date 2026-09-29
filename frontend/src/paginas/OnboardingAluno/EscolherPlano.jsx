import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../paginasCSS/OnboardingAluno.css'
import CabecalhoPagina from '../../componentes/CabecalhoPagina.jsx'

function EscolherPlano() {
  const [planoSelecionado, definirPlanoSelecionado] = useState('')
  const navegar = useNavigate()

  function continuarEscolhaPlano() {
    if (planoSelecionado === 'gratuito') {
      navegar('/onboarding/aluno')
    }

    if (planoSelecionado === 'pago') {
      navegar('/onboarding/checkout')
    }
  }

  return (
    <main className="pagina-escolher-plano">
      <CabecalhoPagina nomePagina="Escolha seu plano" />

      <section className="conteudo-escolher-plano">
        <div className="cabecalho-escolher-plano">
          <p className="etapa-onboarding">Passo 1 de 2</p>

          <h1 className="titulo-escolher-plano">
            Escolha seu plano
          </h1>

          <p className="descricao-escolher-plano">
            Defina como você quer estudar com a NEXO.
          </p>
        </div>

        <div className="lista-planos">
          <article
            className={`cartao-plano ${
              planoSelecionado === 'gratuito'
                ? 'cartao-plano-selecionado'
                : ''
            }`}
          >
            <h2 className="titulo-plano">Plano Gratuito</h2>

            <p className="preco-plano">
              R$ 0,00
              <span>/mês</span>
            </p>

            <p className="descricao-plano">
              Ideal para começar a conhecer a plataforma.
            </p>

            <ul className="beneficios-plano">
              <li>Plano de estudos básico</li>
              <li>Acesso às avaliações diagnósticas</li>
              <li>Recomendações iniciais</li>
              <li>Acompanhamento de progresso</li>
            </ul>

            <button
              type="button"
              className="botao-escolher-plano botao-plano-gratuito"
              onClick={() => definirPlanoSelecionado('gratuito')}
            >
              Escolher plano gratuito
            </button>
          </article>

          <article
            className={`cartao-plano cartao-plano-pago ${
              planoSelecionado === 'pago'
                ? 'cartao-plano-selecionado'
                : ''
            }`}
          >
            <span className="selo-mais-popular">Mais popular</span>

            <h2 className="titulo-plano">Plano Pago</h2>

            <p className="preco-plano">
              R$ 29,90
              <span>/mês</span>
            </p>

            <p className="descricao-plano">
              Para quem quer um acompanhamento mais completo.
            </p>

            <ul className="beneficios-plano">
              <li>Planos de estudos personalizados</li>
              <li>Acesso ilimitado a questões</li>
              <li>Relatórios completos e gráficos</li>
              <li>Conteúdos e simulados exclusivos</li>
              <li>Materiais complementares</li>
              <li>Acompanhamento da evolução</li>
            </ul>

            <button
              type="button"
              className="botao-escolher-plano botao-plano-pago"
              onClick={() => definirPlanoSelecionado('pago')}
            >
              Escolher plano pago
            </button>
          </article>
        </div>

        <button
          type="button"
          className="botao-continuar-plano"
          disabled={!planoSelecionado}
          onClick={continuarEscolhaPlano}
        >
          Continuar
        </button>
      </section>
    </main>
  )
}

export default EscolherPlano