// =====================================================================
// routes/ResponsavelRoutes.js - /api/responsavel
// Dados pessoais (CPF, telefone): só admin.
// =====================================================================

import { Router } from 'express';
import * as ResponsavelController from '../controllers/ResponsavelController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const responsavelRouter = Router();
responsavelRouter.use(autenticar, exigirPerfil('admin'));

responsavelRouter.get('/', ResponsavelController.listar);
responsavelRouter.get('/:id', ResponsavelController.buscarPorId);
responsavelRouter.post('/', ResponsavelController.criar);
responsavelRouter.put('/:id', ResponsavelController.atualizar);
responsavelRouter.delete('/:id', ResponsavelController.excluir);
