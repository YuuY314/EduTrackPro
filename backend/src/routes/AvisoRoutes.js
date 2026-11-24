// =====================================================================
// routes/AvisoRoutes.js - /api/aviso
// Todos os perfis logados leem; só a equipe publica; só admin apaga.
// =====================================================================

import { Router } from 'express';
import * as AvisoController from '../controllers/AvisoController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const avisoRouter = Router();
avisoRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');
const somenteAdmin = exigirPerfil('admin');

avisoRouter.get('/', AvisoController.listar);
avisoRouter.get('/:id', AvisoController.buscarPorId);
avisoRouter.post('/', equipe, AvisoController.criar);
avisoRouter.put('/:id', equipe, AvisoController.atualizar);
avisoRouter.delete('/:id', somenteAdmin, AvisoController.excluir);
