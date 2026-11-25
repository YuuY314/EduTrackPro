// =====================================================================
// routes/TarefaRoutes.js - /api/tarefa
// Todos os perfis logados leem; a equipe cria, edita e apaga.
// =====================================================================

import { Router } from 'express';
import * as TarefaController from '../controllers/TarefaController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const tarefaRouter = Router();
tarefaRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');

tarefaRouter.get('/', TarefaController.listar);
tarefaRouter.get('/:id', TarefaController.buscarPorId);
tarefaRouter.post('/', equipe, TarefaController.criar);
tarefaRouter.put('/:id', equipe, TarefaController.atualizar);
tarefaRouter.delete('/:id', equipe, TarefaController.excluir);
