// =====================================================================
// routes/DisciplinaRoutes.js - /api/disciplina
// Equipe lê; só admin cadastra, edita e apaga.
// =====================================================================

import { Router } from 'express';
import * as DisciplinaController from '../controllers/DisciplinaController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const disciplinaRouter = Router();
disciplinaRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');
const somenteAdmin = exigirPerfil('admin');

disciplinaRouter.get('/', equipe, DisciplinaController.listar);
disciplinaRouter.get('/:id', equipe, DisciplinaController.buscarPorId);
disciplinaRouter.post('/', somenteAdmin, DisciplinaController.criar);
disciplinaRouter.put('/:id', somenteAdmin, DisciplinaController.atualizar);
disciplinaRouter.delete('/:id', somenteAdmin, DisciplinaController.excluir);
