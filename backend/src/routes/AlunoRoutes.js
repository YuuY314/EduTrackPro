// =====================================================================
// routes/AlunoRoutes.js - cadastro de alunos (prefixo /api/alunos)
//
// Professor pode CONSULTAR alunos; só o admin cria, edita e remove.
// =====================================================================

import { Router } from 'express';

import * as AlunoController from '../controllers/AlunoController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const alunoRouter = Router();

alunoRouter.use(autenticar); // todas as rotas abaixo exigem token

const leitura = exigirPerfil('admin', 'professor');
const escrita = exigirPerfil('admin');

alunoRouter.get('/', leitura, AlunoController.listar);
alunoRouter.get('/:id', leitura, AlunoController.buscarPorId);
alunoRouter.post('/', escrita, AlunoController.criar);
alunoRouter.put('/:id', escrita, AlunoController.atualizar);
alunoRouter.delete('/:id', escrita, AlunoController.excluir);
