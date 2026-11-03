const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const classRoutes = require('./routes/classRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const tutorRoutes = require('./routes/tutorRoutes');

// 1. Importação das Rotas
const userRoutes = require('./routes/userRoutes');
const diagnosticFormsRoutes = require('./routes/diagnosticFormsRoutes');

// 2. Inicialização do App
const app = express();
const rawFrontendUrl = process.env.FRONTEND_URL || 'https://nexo-educacao.vercel.app';
const cleanFrontendUrl = rawFrontendUrl
  .replace(/^['"\[]+|['"\]]+$/g, '')
  .split('](')[0]
  .replace(/\[/g, '')
  .replace(/\/+$/, '');

// 3. Middlewares Globais
app.use(cors({
  origin: [
    cleanFrontendUrl,
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// ROTA RAIZ ESTILIZADA (Status da API para o Cold Start do Render)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NEXO — API & Serviços</title>
      <style>
        body { margin: 0; background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
        .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.25); max-width: 400px; width: 90%; }
        .status { color: #10b981; font-weight: 600; margin-bottom: 1.2rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.95rem; }
        .pulse { width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        h2 { margin-top: 0; color: #ffffff; font-size: 1.5rem; }
        p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
        a { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #7c3aed; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; transition: background 0.2s; }
        a:hover { background: #6d28d9; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🎓 NEXO — API</h2>
        <div class="status"><div class="pulse"></div> Servidor Online & Operacional</div>
        <p>O backend do NEXO está ativo e pronto para autenticação e requisições do aplicativo.</p>
        <a href="${cleanFrontendUrl}">Acessar Plataforma</a>
      </div>
    </body>
    </html>
  `);
});

app.use('/api/study-plans', studyPlanRoutes);

// 4. Registro das Rotas da API
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/diagnostics', diagnosticFormsRoutes);

// dashboard
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/chat', tutorRoutes);

// 5. Inicialização do Servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});
