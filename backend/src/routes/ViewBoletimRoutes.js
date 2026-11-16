// =====================================================================
// routes/ViewBoletimRoutes.js - boletim (prefixo /api/boletim no app.js)
//
// É uma VIEW, então só existem rotas GET.
// O aluno vê só o PRÓPRIO boletim (/meu); admin e professor veem de todos.
// A rota fixa '/meu' vem antes das rotas com parâmetro.
// =====================================================================

import { Router } from 'express';

import * as ViewBoletimController from '../controllers/ViewBoletimController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const viewBoletimRouter = Router();

viewBoletimRouter.use(autenticar); // todas as rotas abaixo exigem token

const equipe = exigirPerfil('admin', 'professor');

viewBoletimRouter.get('/meu', exigirPerfil('aluno'), ViewBoletimController.meu);
viewBoletimRouter.get('/aluno/:id', equipe, ViewBoletimController.buscarPorAluno);
viewBoletimRouter.get('/', equipe, ViewBoletimController.listar);