import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import imagemLogoNexo from '../assets/NEXO_LOGO-sem-fundo.png'
import { apiClient } from '../servicos/apiClient.js'
import '../paginasCSS/PaginaInicial.css'

const links = [['#sobre', 'Sobre a NEXO'], ['#para-professores', 'Para Professores'], ['#para-alunos', 'Para Alunos'], ['#como-funciona', 'Como Funciona']]
const professores = [
  ['📊', 'Diagnóstico de Necessidades', 'Identifique com clareza em quais conteúdos a turma ou um aluno específico possui maior dificuldade.'],
  ['🎯', 'Aplicação de Atividades Direcionadas', 'Crie e atribua tarefas focadas nas reais fragilidades identificadas.'],
  ['📈', 'Acompanhamento de Evolução', 'Monitore o progresso em tempo real com relatórios de desenvolvimento contínuo.'],
]
const alunos = [
  ['🧩', 'Plano de Estudos Personalizado', 'Receba sugestões de trilhas e materiais ajustados ao seu ritmo.'],
  ['💡', 'Orientação Direta do Professor', 'Receba feedback contínuo para saber exatamente o que aprimorar.'],
  ['🏆', 'Evolução Focada', 'Estude sem perder tempo com o que você já domina, focando onde realmente faz a diferença.'],
]

function GradeRecursos({ itens }) {
  return <div className="inicio-recursos-grid">{itens.map(([icon, title, text]) => <article className="inicio-recurso-card" key={title}><span className="inicio-recurso-icone" aria-hidden="true">{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
}

function PaginaInicial() {
  const navegar = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [validandoSessao, setValidandoSessao] = useState(() => Boolean(localStorage.getItem('nexo_token')))
  useEffect(() => {
    if (!localStorage.getItem('nexo_token')) return
    let ativo = true
    apiClient('/dashboard').then((response) => { if (response.ok) navegar('/inicio', { replace: true }) }).catch(() => {}).finally(() => { if (ativo) setValidandoSessao(false) })
    return () => { ativo = false }
  }, [navegar])
  if (validandoSessao) return <main className="pagina-inicial animate-fade-in" aria-busy="true" />

  return (
    <main className="pagina-inicial animate-fade-in">
      <header className="cabecalho-inicial">
        <Link className="logo-inicial" to="/" aria-label="NEXO: página inicial"><img className="imagem-logo-inicial" src={imagemLogoNexo} alt="NEXO" /></Link>
        <nav className={`navegacao-inicial${menuAberto ? ' navegacao-inicial-aberta' : ''}`} aria-label="Navegação principal">{links.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuAberto(false)}>{label}</a>)}</nav>
        <div className="acoes-cabecalho-inicial"><Link className="botao-login-inicial" to="/login">Login</Link><button className="botao-menu-inicial" type="button" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} onClick={() => setMenuAberto((aberto) => !aberto)}><span aria-hidden="true">{menuAberto ? '×' : '☰'}</span></button></div>
      </header>

      <section className="secao-apresentacao" aria-labelledby="titulo-inicial"><div className="conteudo-apresentacao">
        <p className="frase-apresentacao">Seu caminho, seu foco, seu resultado.</p>
        <h1 id="titulo-inicial" className="titulo-pagina-inicial"><span>Descubra o que</span><span>você precisa</span><span className="titulo-pagina-inicial-destaque">Aprimorar.</span></h1>
        <p className="descricao-apresentacao">A Nexo analisa seus resultados e orienta seus próximos passos com um plano de estudos personalizado!</p>
        <Link className="botao-criar-conta" to="/cadastro/aluno"><span>Criar sua conta</span><span aria-hidden="true">→</span></Link>
      </div></section>

      <section className="inicio-secao inicio-sobre" id="sobre"><div className="inicio-container inicio-sobre-conteudo"><span className="inicio-eyebrow">APRENDIZAGEM COM DIREÇÃO</span><h2>Conectando Professores e Alunos com Precisão</h2><p>A NEXO é uma plataforma inteligente voltada à orientação educacional personalizada. Ela analisa o desempenho dos alunos para diagnosticar lacunas de aprendizado e fornecer insights precisos.</p><div className="inicio-sobre-destaque"><span aria-hidden="true">✦</span><span>Dados que aproximam cada estudante do próximo passo.</span></div></div></section>

      <section className="inicio-secao" id="para-professores"><div className="inicio-container"><div className="inicio-secao-cabecalho"><span className="inicio-eyebrow">PARA PROFESSORES</span><h2>Gestão e Direcionamento Pedagógico</h2><p>Transforme evidências de aprendizagem em ações pedagógicas mais precisas.</p></div><GradeRecursos itens={professores} /></div></section>

      <section className="inicio-secao inicio-secao-alunos" id="para-alunos"><div className="inicio-container"><div className="inicio-secao-cabecalho"><span className="inicio-eyebrow">PARA ALUNOS</span><h2>Seu Caminho, Seu Foco, Seu Resultado</h2><p>Aprenda no seu ritmo e concentre sua energia no que vai fazer você avançar.</p></div><GradeRecursos itens={alunos} /></div></section>

      <section className="inicio-secao inicio-como-funciona" id="como-funciona"><div className="inicio-container"><div className="inicio-secao-cabecalho"><span className="inicio-eyebrow">SIMPLES E CONTÍNUO</span><h2>Como Funciona na Prática</h2><p>Um ciclo claro para transformar diagnóstico em evolução.</p></div><ol className="inicio-etapas">
        <li><span className="inicio-etapa-numero">01</span><div><h3>Cadastro e Avaliação Diagnóstica</h3><p>O estudante compartilha seu perfil e realiza uma avaliação inicial.</p></div></li>
        <li><span className="inicio-etapa-numero">02</span><div><h3>Análise de Desempenho &amp; Recomendações</h3><p>A plataforma identifica oportunidades de aprendizagem e sugere próximos passos.</p></div></li>
        <li><span className="inicio-etapa-numero">03</span><div><h3>Aplicação Prática e Evolução Contínua</h3><p>Atividades e acompanhamento ajudam a consolidar cada avanço.</p></div></li>
      </ol></div></section>

      <footer className="rodape-inicial"><div className="inicio-container rodape-inicial-conteudo"><Link className="logo-inicial rodape-logo" to="/" aria-label="NEXO: página inicial"><img className="imagem-logo-inicial" src={imagemLogoNexo} alt="NEXO" /></Link><p>© {new Date().getFullYear()} NEXO. Todos os direitos reservados.</p><nav className="rodape-links" aria-label="Links rápidos">{links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav></div></footer>
    </main>
  )
}

export default PaginaInicial
