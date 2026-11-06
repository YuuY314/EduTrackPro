// =====================================================================
// routes/ProfessorRoutes.js - cadastro de professores (prefixo /api/professores)
// Só o admin mexe no cadastro de professores.
// =====================================================================

import { Router } from 'express';

import * as ProfessorController from '../controllers/ProfessorController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const professorRouter = Router();

professorRouter.use(autenticar, exigirPerfil('admin'));

professorRouter.get('/', ProfessorController.listar);
professorRouter.get('/:id', ProfessorController.buscarPorId);
professorRouter.post('/', ProfessorController.criar);
professorRouter.put('/:id', ProfessorController.atualizar);
professorRouter.delete('/:id', ProfessorController.excluir);
