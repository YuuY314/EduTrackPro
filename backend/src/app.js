// =====================================================================
// app.js - monta o Express: segurança -> rotas -> 404 -> erros
// =====================================================================

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { ambiente } from './config/ambiente.js';
import { pool } from './config/database.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { alunoRouter } from './routes/AlunoRoutes.js';
import { authRouter } from './routes/AuthRoutes.js';
import { professorRouter } from './routes/ProfessorRoutes.js';

export const app = express();

// 1. Defesas de borda
app.use(helmet());
app.use(cors({ origin: ambiente.frontendUrl })); // só o nosso front pode chamar a API
app.use(express.json());

// 2. Rotas
app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1'); // se o MySQL cair, o errorHandler responde 500
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRouter);
app.use('/api/alunos', alunoRouter);
app.use('/api/professores', professorRouter);

// 3. Nada casou -> 404; algo deu erro -> errorHandler
app.use(notFound);
app.use(errorHandler);
