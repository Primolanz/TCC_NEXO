# 🎓 NEXO — Plataforma Educacional & Organizador de Estudos

O **NEXO** é uma plataforma educacional desenvolvida para transformar a rotina de estudantes e professores no ensino presencial. Atuando como um assistente de organização e engajamento — inspirado em plataformas como a *Khan Academy*, mas focado no ecossistema da sala de aula física —, o NEXO centraliza o acompanhamento de tarefas, avisos e suporte de inteligência artificial com o **Tutor NEXO**.

---

## 💡 Proposta de Valor & Foco Presencial

Diferente de repositórios tradicionais que exigem o upload de arquivos e correções digitais complexas, o **NEXO** foca na **gestão prática e organização da rotina escolar**:
* **Lembretes e Tarefas Presenciais:** O professor publica orientações diretas para o estudo presencial (ex: *"Exercício 15 do livro, página 512 — Frações"*).
* **Notificações e Checklist do Aluno:** Os alunos recebem notificações sobre os prazos, organizam suas pendências e marcam as tarefas como concluídas assim que realizam o dever no livro/caderno.
* **Validação em Sala de Aula:** O professor acompanha no painel o índice de engajamento da turma e faz a verificação/visto presencialmente.

---

## 🚀 Funcionalidades Principais

### 👨‍🏫 Painel do Professor
* **Gestão de Turmas:** Visualização centralizada das turmas acompanhadas e contagem de alunos matriculados.
* **Relatórios de Desempenho:** Métrica de adesão/entregas e acompanhamento do engajamento ativo dos alunos.
* **Detalhamento por Turma:** Modal interativo que exibe os alunos matriculados, histórico de tarefas publicadas e status de conclusão.
* **Publicação de Atividades:** Envio simplificado de lembretes e tarefas com prazos definidos.

### 👨‍🎓 Painel do Aluno & Tutor NEXO
* **Onboarding & Avaliação Diagnóstica:** Mapeamento do perfil e das preferências de estudo no primeiro acesso.
* **Visão Geral de Pendências:** Organizador de tarefas com controle de prazos e botão de "Concluir".
* **🤖 Tutor NEXO (IA):** Assistente virtual integrado (exclusivo para plano Premium) alimentado pela Groq API. Tira dúvidas de estudo em tempo real com base nas disciplinas do aluno.

### 🔐 Autenticação & Segurança
* Autenticação segura de Alunos e Professores via Supabase Auth.
* Fluxo de Redefinição de Senha por e-mail com tela dedicada e tratamento de *rate limit*.

### 📱 Design & UI/UX
* Interface moderna em Dark Theme, responsiva para smartphones, tablets e notebooks.
* Menu hambúrguer interativo para navegação mobile.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **React.js** (Vite)
* **Tailwind CSS**
* **Lucide React** (Ícones)
* **Vercel** (Hospedagem Frontend)

### Backend
* **Node.js** com **Express**
* **Supabase** (Auth & PostgreSQL)
* **Groq API** (Llama 3 / Tutor NEXO)
* **Render** (Hospedagem Backend)

---

## 📂 Estrutura do Repositório

```text
TCC_NEXO/
├── frontend/             # Aplicação React (Vite, Tailwind, UI/UX)
│   ├── src/              # Componentes, Páginas e Serviços
│   └── vercel.json       # Configuração de rotas SPA para a Vercel
├── backend/              # API Node.js / Express
│   ├── src/              # Controllers, Routes, Middlewares e Services
│   └── index.js          # Servidor principal
└── supabase/             # Migrações e banco de dados
