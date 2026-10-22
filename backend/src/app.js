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

// 3. Middlewares Globais
app.use(cors());
app.use(express.json());
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
