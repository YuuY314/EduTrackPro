// =====================================================================
// routes/CalendarioEventoRoutes.js - /api/calendario
// Todos os perfis logados leem. Professor cria SOLICITAÇÕES (pendentes)
// e só pode apagar as próprias pendentes (conferido no service).
// Aprovar/recusar (PUT) é só do admin.
// =====================================================================

import { Router } from 'express';
import * as CalendarioEventoController from '../controllers/CalendarioEventoController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const calendarioEventoRouter = Router();
calendarioEventoRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');
const somenteAdmin = exigirPerfil('admin');

calendarioEventoRouter.get('/', CalendarioEventoController.listar);
calendarioEventoRouter.get('/:id', CalendarioEventoController.buscarPorId);
calendarioEventoRouter.post('/', equipe, CalendarioEventoController.criar);
calendarioEventoRouter.put('/:id', somenteAdmin, CalendarioEventoController.atualizar);
calendarioEventoRouter.delete('/:id', equipe, CalendarioEventoController.excluir);
