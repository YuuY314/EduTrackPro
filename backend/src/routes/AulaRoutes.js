// =====================================================================
// routes/AulaRoutes.js - /api/aula
// Todas as rotas exigem login (token). Aluno não acessa.
// =====================================================================

import { Router } from 'express';
import * as AulaController from '../controllers/AulaController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const aulaRouter = Router();
aulaRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');
const somenteAdmin = exigirPerfil('admin');

aulaRouter.get('/', equipe, AulaController.listar);
aulaRouter.get('/:id', equipe, AulaController.buscarPorId);
aulaRouter.post('/', equipe, AulaController.criar);
aulaRouter.put('/:id', equipe, AulaController.atualizar);
aulaRouter.delete('/:id', somenteAdmin, AulaController.excluir);
