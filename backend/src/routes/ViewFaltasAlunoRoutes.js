// =====================================================================
// routes/ViewFaltasAlunoRoutes.js - resumo de faltas (prefixo /api/faltas_aluno)
// Só GET, pois vw_faltas_aluno é uma view.
// =====================================================================

import { Router } from 'express';

import * as ViewFaltasAlunoController from '../controllers/ViewFaltasAlunoController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const viewFaltasAlunoRouter = Router();

viewFaltasAlunoRouter.use(autenticar);

const equipe = exigirPerfil('admin', 'professor');

viewFaltasAlunoRouter.get('/meu', exigirPerfil('aluno'), ViewFaltasAlunoController.meu);
viewFaltasAlunoRouter.get('/aluno/:id', equipe, ViewFaltasAlunoController.buscarPorAluno);
viewFaltasAlunoRouter.get('/', equipe, ViewFaltasAlunoController.listar);