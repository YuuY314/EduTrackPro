// =====================================================================
// app.js - monta o Express: segurança -> rotas -> 404 -> erros
// =====================================================================

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { ambiente } from './config/ambiente.js';
import { pool } from './config/database.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { authRouter } from './routes/AuthRoutes.js';

import { alunoRouter } from './routes/AlunoRoutes.js';
import { aulaRouter } from './routes/AulaRoutes.js';
import { avaliacaoRouter } from './routes/AvaliacaoRoutes.js';
import { disciplinaRouter } from './routes/DisciplinaRoutes.js';
import { professorRouter } from './routes/ProfessorRoutes.js';
import { turma_disciplina_professorRouter } from './routes/TurmaDisciplinaProfessorRoutes.js';
import { turmaRouter } from './routes/TurmaRoutes.js';

import { gmailAPIRouter } from './routes/GmailAPIRoutes.js';

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

app.use('/api/aluno', alunoRouter);
app.use('/api/aula', aulaRouter);
app.use('/api/avaliacao', avaliacaoRouter);
app.use('/api/disciplina', disciplinaRouter);
app.use('/api/professores', professorRouter);
app.use('/api/turma_disciplina_professor', turma_disciplina_professorRouter);
app.use('/api/turma', turmaRouter);

app.use('/api/boletim', viewBoletimRouter);
app.use('/api/faltas_aluno', viewFaltasAlunoRouter);

app.use('/api/email', gmailAPIRouter);

// 3. Nada casou -> 404; algo deu erro -> errorHandler
app.use(notFound);
app.use(errorHandler);
