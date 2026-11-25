// =====================================================================
// routes/NotaRoutes.js - /api/nota
// Boletim da turma: equipe (o controller confere se o professor leciona
// no id_tdp). CRUD avulso de notas: só admin.
// IMPORTANTE: /boletim vem ANTES de /:id.
// =====================================================================

import { Router } from 'express';
import * as NotaController from '../controllers/NotaController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const notaRouter = Router();
notaRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');
const somenteAdmin = exigirPerfil('admin');

notaRouter.get('/boletim', equipe, NotaController.buscarBoletim);
notaRouter.post('/boletim', equipe, NotaController.salvarBoletim);

notaRouter.get('/', somenteAdmin, NotaController.listar);
notaRouter.get('/:id', somenteAdmin, NotaController.buscarPorId);
notaRouter.post('/', somenteAdmin, NotaController.criar);
notaRouter.put('/:id', somenteAdmin, NotaController.atualizar);
notaRouter.delete('/:id', somenteAdmin, NotaController.excluir);
