const express = require('express');
const cors = require('cors');
const dashboardRoutes = require('./routes/dashboardRoutes');
require('dotenv').config();

// 1. Importação das Rotas
const userRoutes = require('./routes/userRoutes');
const diagnosticFormsRoutes = require('./routes/diagnosticFormsRoutes');

// 2. Inicialização do App
const app = express();

// 3. Middlewares Globais
app.use(cors());
app.use(express.json());

// 4. Registro das Rotas da API
app.use('/api/users', userRoutes);
app.use('/api/diagnostics', diagnosticFormsRoutes);

// dashboard
app.use('/api/dashboard', dashboardRoutes);

// 5. Inicialização do Servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});