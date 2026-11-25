// =====================================================================
// routes/FrequenciaRoutes.js - /api/frequencia
// Chamada: equipe (o controller confere se o professor leciona no id_tdp).
// CRUD avulso de frequência: só admin.
// IMPORTANTE: /chamada e /horarios vêm ANTES de /:id, senão o Express
// acharia que "chamada" é um id.
// =====================================================================

import { Router } from 'express';
import * as FrequenciaController from '../controllers/FrequenciaController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const frequenciaRouter = Router();
frequenciaRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');
const somenteAdmin = exigirPerfil('admin');

frequenciaRouter.get('/chamada', equipe, FrequenciaController.buscarChamada);
frequenciaRouter.post('/chamada', equipe, FrequenciaController.salvarChamada);
frequenciaRouter.get('/horarios/:id_tdp', equipe, FrequenciaController.listarHorarios);

frequenciaRouter.get('/', somenteAdmin, FrequenciaController.listar);
frequenciaRouter.get('/:id', somenteAdmin, FrequenciaController.buscarPorId);
frequenciaRouter.post('/', somenteAdmin, FrequenciaController.criar);
frequenciaRouter.put('/:id', somenteAdmin, FrequenciaController.atualizar);
frequenciaRouter.delete('/:id', somenteAdmin, FrequenciaController.excluir);
