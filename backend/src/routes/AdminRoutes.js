// routes/AdminRoutes.js - painel do administrador (prefixo /api/admin). Só perfil "admin".
import { Router } from 'express';

import * as S from '../services/AdminService.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const adminRouter = Router();
adminRouter.use(autenticar, exigirPerfil('admin'));

const get = (fn) => async (req, res) => res.json(await fn(req));
const post = (fn) => async (req, res) => res.status(201).json(await fn(req));
const del = (fn) => async (req, res) => { await fn(req); res.status(204).send(); };

adminRouter.get('/resumo', get(() => S.resumo()));

adminRouter.get('/turmas', get(() => S.listarTurmas()));
adminRouter.post('/turmas', post((r) => S.criarTurma(r.body)));

adminRouter.get('/responsaveis', get(() => S.listarResponsaveis()));

adminRouter.get('/alunos', get(() => S.listarAlunos()));
adminRouter.post('/alunos', post((r) => S.criarAluno(r.body)));
adminRouter.put('/alunos/:id', get((r) => S.atualizarAluno(r.params.id, r.body)));
adminRouter.delete('/alunos/:id', del((r) => S.excluirAluno(r.params.id)));

adminRouter.get('/professores', get(() => S.listarProfessores()));
adminRouter.post('/professores', post((r) => S.criarProfessor(r.body)));
adminRouter.put('/professores/:id', get((r) => S.atualizarProfessor(r.params.id, r.body)));
adminRouter.delete('/professores/:id', del((r) => S.excluirProfessor(r.params.id)));

adminRouter.post('/administradores', post((r) => S.criarAdministrador(r.body)));
