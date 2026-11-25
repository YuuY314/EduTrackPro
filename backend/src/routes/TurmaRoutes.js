// =====================================================================
// routes/TurmaRoutes.js - /api/turma
// Todos os perfis logados leem; só admin cria, edita e apaga.
// =====================================================================

import { Router } from 'express';
import * as TurmaController from '../controllers/TurmaController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const turmaRouter = Router();
turmaRouter.use(autenticar);

const somenteAdmin = exigirPerfil('admin');

turmaRouter.get('/', TurmaController.listar);
turmaRouter.get('/:id', TurmaController.buscarPorId);
turmaRouter.post('/', somenteAdmin, TurmaController.criar);
turmaRouter.put('/:id', somenteAdmin, TurmaController.atualizar);
turmaRouter.delete('/:id', somenteAdmin, TurmaController.excluir);
