// =====================================================================
// routes/AdministradorRoutes.js - cadastro de administradores (prefixo /api/administrador)
// =====================================================================

import { Router } from 'express';

import * as AdministradorController from '../controllers/AdministradorController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const administradorRouter = Router();

administradorRouter.use(autenticar); // todas as rotas abaixo exigem token

const leitura = exigirPerfil('admin');
const escrita = exigirPerfil('admin');

administradorRouter.get('/', leitura, AdministradorController.listar);
administradorRouter.get('/:id', leitura, AdministradorController.buscarPorId);
administradorRouter.post('/', escrita, AdministradorController.criar);
administradorRouter.put('/:id', escrita, AdministradorController.atualizar);
administradorRouter.delete('/:id', escrita, AdministradorController.excluir);
