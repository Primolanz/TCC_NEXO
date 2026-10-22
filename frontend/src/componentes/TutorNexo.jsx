import { useEffect, useRef, useState } from 'react'
import { Bot } from 'lucide-react'
import { apiClient } from '../servicos/apiClient.js'
import '../paginasCSS/TutorNexo.css'

const PERGUNTAS = ['O que tenho para fazer hoje?', 'Por onde devo começar a estudar?', 'Como funciona o simulado RETAKE?']
const CHAT_HISTORY_KEY = 'nexo_tutor_chat_history'
let navigationResetHandled = false

function carregarHistorico() {
  try {
    if (!navigationResetHandled) {
      const navigation = window.performance?.getEntriesByType?.('navigation')?.[0]
      if (navigation?.type === 'reload') sessionStorage.removeItem(CHAT_HISTORY_KEY)
      navigationResetHandled = true
    }
    const saved = JSON.parse(sessionStorage.getItem(CHAT_HISTORY_KEY) || 'null')
    if (Array.isArray(saved)) {
      const valid = saved.filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
      if (valid.length) return valid
    }
  } catch {
    // Storage indisponível ou conteúdo inválido: inicia uma nova conversa.
  }
  return [{ role: 'assistant', content: 'Oi! Sou o Tutor NEXO. Já estou com seus dados de estudo e posso ajudar você a escolher o próximo passo.' }]
}

function MensagemTexto({ texto }) {
  const inline = (line) => line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })
  const blocks = []
  let listItems = []
  const flushList = () => {
    if (!listItems.length) return
    blocks.push(<ul key={`list-${blocks.length}`}>{listItems}</ul>)
    listItems = []
  }

  texto.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.replace(/^\s{0,3}#{1,6}\s*/, '').trimEnd()
    const listItem = line.match(/^\s*[-•*]\s+(.+)$/)
    if (listItem) {
      listItems.push(<li key={`item-${index}`}>{inline(listItem[1])}</li>)
      return
    }
    flushList()
    if (!line.trim()) {
      blocks.push(<p className="tutor-linha-vazia" key={`line-${index}`} aria-hidden="true">&nbsp;</p>)
      return
    }
    blocks.push(<p key={`line-${index}`}>{inline(line)}</p>)
  })
  flushList()
  return <div className="tutor-mensagem-texto">{blocks}</div>
}

export default function TutorNexo({ isPremium, context, onPremium }) {
  const [messages, setMessages] = useState(carregarHistorico)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    try { sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages)) } catch { /* Mantém o chat utilizável se o storage estiver indisponível. */ }
  }, [messages])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, loading])

  async function enviar(text = input) {
    const content = text.trim()
    if (!content || loading) return
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setError('')
    setLoading(true)
    try {
      const response = await apiClient('/chat/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-20), context }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível falar com o Tutor agora.')
      setMessages((current) => [...current, { role: 'assistant', content: body.reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return <section className="tutor-pagina" aria-labelledby="tutor-titulo">
    <header className="tutor-cabecalho"><div><span className="tutor-kicker">SEU MENTOR DE ESTUDOS</span><h1 id="tutor-titulo">Tutor NEXO</h1><p>Uma conversa que considera suas tarefas, seu plano e sua evolução.</p></div><span className="tutor-online"><i /> Tutor disponível</span></header>
    <div className={`tutor-painel ${!isPremium ? 'tutor-painel-bloqueado' : ''}`}>
      <div className="tutor-conversa" aria-live="polite">
        {messages.map((message, index) => <article className={`tutor-mensagem ${message.role === 'user' ? 'tutor-mensagem-aluno' : 'tutor-mensagem-assistente'}`} key={`${index}-${message.role}`}>
          {message.role === 'assistant' && <span className="tutor-avatar" aria-hidden="true"><Bot size={19} strokeWidth={1.8} /></span>}
          <div className="tutor-balao"><span className="tutor-autor">{message.role === 'user' ? 'Você' : 'Tutor NEXO'}</span><MensagemTexto texto={message.content} /></div>
        </article>)}
        {loading && <div className="tutor-digitando" role="status"><span className="tutor-avatar" aria-hidden="true"><Bot size={19} strokeWidth={1.8} /></span><span>Tutor NEXO está analisando seus estudos<span className="tutor-pontos">...</span></span></div>}
        <div ref={endRef} />
      </div>
      <div className="tutor-atalhos"><span>Perguntas para começar</span><div>{PERGUNTAS.map((question) => <button key={question} type="button" onClick={() => enviar(question)} disabled={loading}>{question}</button>)}</div></div>
      {error && <p className="tutor-erro" role="alert">{error}</p>}
      <form className="tutor-form" onSubmit={(event) => { event.preventDefault(); enviar() }}><label className="sr-only" htmlFor="tutor-input">Sua pergunta</label><textarea id="tutor-input" rows="1" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); enviar() } }} placeholder="Pergunte sobre seus estudos..." disabled={loading || !isPremium} /><button type="submit" disabled={loading || !input.trim() || !isPremium} aria-label="Enviar mensagem">Enviar <span aria-hidden="true">↑</span></button></form>
      {!isPremium && <div className="tutor-bloqueio"><div className="tutor-bloqueio-card"><span className="tutor-cadeado" aria-hidden="true">✦</span><strong>Seu próximo passo merece um mentor</strong><p>Tenha orientações personalizadas com base nas suas tarefas, no plano de estudos e no seu desempenho.</p><button type="button" onClick={onPremium}>Seja Premium para liberar o Tutor AI</button></div></div>}
    </div>
    <p className="tutor-privacidade">O contexto enviado inclui apenas informações de estudo exibidas no seu painel.</p>
  </section>
}
