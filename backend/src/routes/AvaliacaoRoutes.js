// =====================================================================
// routes/AvaliacaoRoutes.js - /api/avaliacao
// Todas as rotas exigem login (token). Aluno não acessa.
// =====================================================================

import { Router } from 'express';
import * as AvaliacaoController from '../controllers/AvaliacaoController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const avaliacaoRouter = Router();
avaliacaoRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');
const somenteAdmin = exigirPerfil('admin');

avaliacaoRouter.get('/', equipe, AvaliacaoController.listar);
avaliacaoRouter.get('/:id', equipe, AvaliacaoController.buscarPorId);
avaliacaoRouter.post('/', equipe, AvaliacaoController.criar);
avaliacaoRouter.put('/:id', equipe, AvaliacaoController.atualizar);
avaliacaoRouter.delete('/:id', somenteAdmin, AvaliacaoController.excluir);
