// =====================================================================
// routes/HorarioAulaRoutes.js - /api/horario_aula
// Todos os perfis logados leem a grade; só admin altera.
// =====================================================================

import { Router } from 'express';
import * as HorarioAulaController from '../controllers/HorarioAulaController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const horarioAulaRouter = Router();
horarioAulaRouter.use(autenticar);

const somenteAdmin = exigirPerfil('admin');

horarioAulaRouter.get('/', HorarioAulaController.listar);
horarioAulaRouter.get('/:id', HorarioAulaController.buscarPorId);
horarioAulaRouter.post('/', somenteAdmin, HorarioAulaController.criar);
horarioAulaRouter.put('/:id', somenteAdmin, HorarioAulaController.atualizar);
horarioAulaRouter.delete('/:id', somenteAdmin, HorarioAulaController.excluir);
