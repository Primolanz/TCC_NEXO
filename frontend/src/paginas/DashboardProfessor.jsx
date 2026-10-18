import { useCallback, useEffect, useState } from 'react'
import RoleDashboard from '../componentes/RoleDashboard.jsx'
import { apiClient } from '../servicos/apiClient.js'

const navigation = [
  { id: 'inicio', title: 'Início' },
  { id: 'turmas', title: 'Minhas Turmas' },
  { id: 'atividade', title: 'Lançar Atividade' },
  { id: 'relatorios', title: 'Relatórios' },
]

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const horarios = [
  ...Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`),
  '23:59',
]

function dateTimePartsInSaoPaulo(date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value }) => [type, value]))
}

function formatSaoPauloDateTimeLocal(date) {
  const parts = dateTimePartsInSaoPaulo(date)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function getMinimumSaoPauloDateTime() {
  return formatSaoPauloDateTimeLocal(new Date(Math.ceil(Date.now() / 60000) * 60000))
}

function dateTimeLocalToIsoSaoPaulo(value) {
  if (!value || !value.includes('T') || value.endsWith('T')) return null
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const localWallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const represented = dateTimePartsInSaoPaulo(new Date(localWallClockAsUtc))
  const saoPauloWallClockAsUtc = Date.UTC(
    Number(represented.year), Number(represented.month) - 1, Number(represented.day),
    Number(represented.hour), Number(represented.minute),
  )
  const offset = saoPauloWallClockAsUtc - localWallClockAsUtc
  return new Date(localWallClockAsUtc - offset).toISOString()
}

function formatDatePtBr(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = dateTimePartsInSaoPaulo(date)
  return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`
}

function DashboardProfessor() {
  const [dataAtualFormatadaISO, setDataAtualFormatadaISO] = useState(getMinimumSaoPauloDateTime)
  const [dataEntrega, setDataEntrega] = useState({ dia: '', mes: '', ano: '' })
  const [horarioEntrega, setHorarioEntrega] = useState('')
  const [classes, setClasses] = useState([])
  const [activities, setActivities] = useState([])
  const [creatingActivity, setCreatingActivity] = useState(false)
  const [activityError, setActivityError] = useState('')
  const [activitySuccess, setActivitySuccess] = useState('')
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [creatingClass, setCreatingClass] = useState(false)
  const [classError, setClassError] = useState('')
  const [classSuccess, setClassSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const dataHojeISO = dataAtualFormatadaISO.slice(0, 10)
  const anoAtual = Number(dataHojeISO.slice(0, 4))
  const diasNoMes = dataEntrega.mes && dataEntrega.ano
    ? new Date(Number(dataEntrega.ano), Number(dataEntrega.mes), 0).getDate()
    : 31
  const dataEntregaISO = dataEntrega.dia && dataEntrega.mes && dataEntrega.ano
    ? `${dataEntrega.ano}-${dataEntrega.mes}-${dataEntrega.dia}`
    : ''

  useEffect(() => {
    const atualizarMinimo = () => setDataAtualFormatadaISO(getMinimumSaoPauloDateTime())
    const timer = window.setInterval(atualizarMinimo, 15000)
    return () => window.clearInterval(timer)
  }, [])

  const carregarTurmas = useCallback(async () => {
    setLoadingClasses(true)
    try {
      const response = await apiClient('/classes')
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar suas turmas.')
      setClasses(Array.isArray(body.classes) ? body.classes : [])
      setClassError('')
    } catch (error) {
      setClassError(error.message)
      throw error
    } finally {
      setLoadingClasses(false)
    }
  }, [])

  useEffect(() => { carregarTurmas().catch(() => {}) }, [carregarTurmas])

  async function criarTurma(event) {
    event.preventDefault()
    setClassError('')
    setClassSuccess('')
    setCreatingClass(true)
    const form = event.currentTarget
    const name = String(new FormData(form).get('nome') || '').trim()

    try {
      const response = await apiClient('/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível criar a turma.')
      setClasses((current) => [body.class, ...current.filter((item) => item.id !== body.class.id)])
      setClassSuccess(`Turma criada. Código de acesso: ${body.class.code}`)
      form.reset()
      carregarTurmas().catch(() => {})
    } catch (error) {
      setClassError(error.message)
    } finally {
      setCreatingClass(false)
    }
  }

  async function copiarCodigo(code) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setClassError('')
    } catch {
      setClassError('Não foi possível copiar o código. Selecione e copie o texto manualmente.')
    }
  }

  async function lancarAtividade(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setActivityError('')
    setActivitySuccess('')
    if (!dataEntregaISO || !horarioEntrega) {
      setActivityError('Selecione a data e o horário limite da atividade.')
      return
    }
    setCreatingActivity(true)

    try {
      const response = await apiClient('/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(form.get('titulo') || '').trim(),
          description: String(form.get('descricao') || '').trim(),
          class_id: String(form.get('turma') || ''),
          due_date: dateTimeLocalToIsoSaoPaulo(`${dataEntregaISO}T${horarioEntrega}`),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível lançar a atividade.')
      setActivities((current) => [body.assignment, ...current])
      setActivitySuccess('Atividade lançada com sucesso. Ela já está disponível para os alunos da turma.')
      formElement.reset()
      setDataEntrega({ dia: '', mes: '', ano: '' })
      setHorarioEntrega('')
    } catch (error) {
      setActivityError(error.message)
    } finally {
      setCreatingActivity(false)
    }
  }

  function renderContent({ user, activeTab, goToTab }) {
    if (activeTab === 'inicio') {
      const metrics = [
        { title: 'Turmas criadas', value: classes.length, badge: 'Minhas turmas', icon: '▦' },
        { title: 'Alunos vinculados', value: classes.reduce((sum, item) => sum + (item.student_count || 0), 0), badge: 'Todas as turmas', icon: '♙' },
        { title: 'Atividades lançadas', value: activities.length, badge: 'Atividades', icon: '✎' },
      ]
      return <>
        <div className="role-metrics">
          {metrics.map((metric) => <article className="role-card" key={metric.title}>
            <span className="role-card-icon" aria-hidden="true">{metric.icon}</span><p>{metric.title}</p><strong>{metric.value}</strong><span className="role-badge">{metric.badge}</span>
          </article>)}
        </div>
        <section className="role-panel role-quick-actions" aria-labelledby="acoes-rapidas-titulo">
          <div className="role-panel-heading"><div><span className="role-kicker">ATALHOS</span><h2 id="acoes-rapidas-titulo">Ações rápidas</h2></div><span className="role-badge">Seu espaço de ensino</span></div>
          <div className="role-action-grid">
            <button className="role-action-card" type="button" onClick={() => goToTab('turmas')}><span className="role-card-icon" aria-hidden="true">＋</span><span><strong>Criar nova turma</strong><small>Organize seus alunos por turma.</small></span><b aria-hidden="true">→</b></button>
            <button className="role-action-card" type="button" onClick={() => goToTab('atividade')}><span className="role-card-icon role-icon-teal" aria-hidden="true">✎</span><span><strong>Lançar atividade</strong><small>Prepare uma tarefa para sua turma.</small></span><b aria-hidden="true">→</b></button>
          </div>
        </section>
        <p className="role-home-note">Olá, Professor {user.name || ''}. Seu painel reúne os principais números e atalhos para o dia a dia.</p>
      </>
    }

    if (activeTab === 'turmas') return <section className="role-tab-panel" aria-labelledby="turmas-titulo">
      <header className="role-panel-heading">
        <div><span className="role-kicker">ORGANIZAÇÃO</span><h2 id="turmas-titulo">Minhas Turmas</h2><p>Crie e acompanhe suas turmas em um só lugar.</p></div>
        <span className="role-badge">{classes.length} {classes.length === 1 ? 'turma' : 'turmas'}</span>
      </header>
      {classSuccess && <p className="class-toast class-toast-success" role="status">{classSuccess}</p>}
      {classError && <p className="class-toast class-toast-error" role="alert">{classError}</p>}
      <form className="role-form" onSubmit={criarTurma}>
        <h3>Criar nova turma</h3>
        <div className="role-form-grid"><label>Nome da turma<input name="nome" placeholder="Ex.: 8º ano A" maxLength="100" required /></label></div>
        <button className="role-primary-button" type="submit" disabled={creatingClass}>{creatingClass ? 'Criando turma…' : '＋ Criar turma'}</button>
      </form>
      <div className="role-list-heading"><h3>Turmas cadastradas</h3><span>{classes.length} no total</span></div>
      {loadingClasses && classes.length === 0 ? <div className="role-empty-state"><strong>Carregando turmas…</strong></div> : classes.length ? <div className="role-list">
        {classes.map((item) => <article className="role-list-item class-list-item" key={item.id}>
          <span className="role-card-icon" aria-hidden="true">▦</span>
          <div className="class-list-details"><strong>{item.name}</strong><small>{item.student_count || 0} {(item.student_count || 0) === 1 ? 'aluno' : 'alunos'}</small><span className="class-code"><span>Código de acesso</span><code>{item.code}</code></span></div>
          <button className="class-copy-button" type="button" onClick={() => copiarCodigo(item.code)}>{copiedCode === item.code ? 'Copiado!' : 'Copiar código'}</button>
        </article>)}
      </div> : <div className="role-empty-state"><span className="role-empty-icon">▦</span><strong>Nenhuma turma criada</strong><p>Use o formulário acima para cadastrar sua primeira turma.</p>{classError && <button className="role-secondary-button" type="button" onClick={() => carregarTurmas().catch(() => {})}>Tentar novamente</button>}</div>}
    </section>

    if (activeTab === 'atividade') {
      return <section className="role-tab-panel" aria-labelledby="atividade-titulo">
        <header className="role-panel-heading"><div><span className="role-kicker">CONTEÚDO PEDAGÓGICO</span><h2 id="atividade-titulo">Lançar Atividade</h2><p>Crie uma tarefa e associe a uma de suas turmas.</p></div><span className="role-badge">{activities.length} lançadas</span></header>
        {activitySuccess && <p className="class-toast class-toast-success" role="status">{activitySuccess}</p>}
        {activityError && <p className="class-toast class-toast-error" role="alert">{activityError}</p>}
        {classes.length ? <form className="role-form" onSubmit={lancarAtividade}>
          <h3>Nova atividade</h3><div className="role-form-grid">
            <label>Turma<select name="turma" defaultValue="" required><option value="" disabled>Selecione uma turma</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Título da atividade<input name="titulo" placeholder="Ex.: Revisão de frações" maxLength="180" required /></label>
            <label className="role-form-wide">Instruções / Conteúdo<textarea name="descricao" placeholder="Descreva o que os alunos devem fazer." rows="4" /></label>
            <label>Data de entrega <small>(DD/MM/AAAA)</small><span className="role-date-selects">
              <select aria-label="Dia de entrega" value={dataEntrega.dia} onChange={(event) => setDataEntrega((current) => ({ ...current, dia: event.target.value }))} required>
                <option value="">DD</option>{Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0')).map((dia) => {
                  const candidata = `${dataEntrega.ano}-${dataEntrega.mes}-${dia}`
                  const disabled = !dataEntrega.mes || !dataEntrega.ano || Number(dia) > diasNoMes || candidata < dataHojeISO
                  return <option key={dia} value={dia} disabled={disabled}>{dia}</option>
                })}
              </select>
              <select aria-label="Mês de entrega" value={dataEntrega.mes} onChange={(event) => setDataEntrega((current) => ({ ...current, mes: event.target.value, dia: '' }))} required>
                <option value="">MM</option>{meses.map((mes, index) => <option key={mes} value={String(index + 1).padStart(2, '0')}>{mes}</option>)}
              </select>
              <select aria-label="Ano de entrega" value={dataEntrega.ano} onChange={(event) => setDataEntrega((current) => ({ ...current, ano: event.target.value, dia: '' }))} required>
                <option value="">AAAA</option>{Array.from({ length: 11 }, (_, index) => anoAtual + index).map((ano) => <option key={ano} value={String(ano)}>{ano}</option>)}
              </select>
            </span></label>
            <label>Horário limite (24h)<select aria-label="Horário limite no formato 24 horas" value={horarioEntrega} onChange={(event) => setHorarioEntrega(event.target.value)} required>
              <option value="">Selecione o horário</option>{horarios.map((horario) => <option key={horario} value={horario} disabled={dataEntregaISO === dataHojeISO && horario < dataAtualFormatadaISO.slice(11, 16)}>{horario}</option>)}
            </select></label>
          </div><button className="role-primary-button" type="submit" disabled={creatingActivity}>{creatingActivity ? 'Publicando…' : '＋ Publicar atividade'}</button>
        </form> : <div className="role-empty-state"><span className="role-empty-icon">＋</span><strong>Crie uma turma para começar</strong><p>As atividades são vinculadas a uma turma. Cadastre uma turma antes de lançar tarefas.</p><button className="role-secondary-button" type="button" onClick={() => goToTab('turmas')}>Ir para Minhas Turmas</button></div>}
        {activities.length > 0 && <div className="role-list role-activities-list"><div className="role-list-heading"><h3>Atividades lançadas</h3><span>{activities.length} no total</span></div>{activities.map((item) => <article className="role-list-item" key={item.id}><span className="role-card-icon role-icon-teal" aria-hidden="true">✎</span><div><strong>{item.title}</strong><small>{item.class_name}{item.due_date ? ` · Entrega: ${formatDatePtBr(item.due_date)}` : ' · Sem data de entrega'}</small></div><span className="role-badge">Publicada</span></article>)}</div>}
      </section>
    }

    return <section className="role-tab-panel" aria-labelledby="relatorios-titulo">
      <header className="role-panel-heading"><div><span className="role-kicker">ACOMPANHAMENTO</span><h2 id="relatorios-titulo">Relatórios de desempenho</h2><p>Visão geral do progresso dos alunos por turma.</p></div><span className="role-badge">Resumo</span></header>
      <div className="role-report-metrics"><article><span>Turmas acompanhadas</span><strong>{classes.length}</strong></article><article><span>Alunos avaliados</span><strong>—</strong></article><article><span>Desempenho médio</span><strong>—</strong></article></div>
      {classes.length ? <div className="role-list">{classes.map((item) => <article className="role-list-item" key={item.id}><span className="role-card-icon" aria-hidden="true">↗</span><div><strong>{item.name}</strong><small>{item.student_count || 0} alunos · Os resultados serão exibidos quando houver avaliações.</small></div><span className="role-badge">Sem dados</span></article>)}</div> : <div className="role-empty-state"><span className="role-empty-icon">↗</span><strong>Relatórios aparecerão aqui</strong><p>Crie uma turma e registre atividades para acompanhar o desempenho dos alunos.</p><button className="role-secondary-button" type="button" onClick={() => goToTab('turmas')}>Criar uma turma</button></div>}
    </section>
  }

  return <RoleDashboard role="TEACHER" title="Área do Professor" eyebrow="SEU ESPAÇO DE ENSINO" subtitle="Acompanhe suas turmas e organize sua rotina docente." navigation={navigation} renderContent={renderContent} />
}

export default DashboardProfessor
