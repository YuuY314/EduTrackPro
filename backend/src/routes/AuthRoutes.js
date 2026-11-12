// =====================================================================
// routes/AuthRoutes.js - caminhos do login (prefixo /api/auth no app.js)
// Os middlewares rodam da esquerda para a direita: autenticar -> controller.
// =====================================================================

import { Router } from 'express';

import * as AuthController from '../controllers/AuthController.js';
import { autenticar } from '../middlewares/autenticar.js';

export const authRouter = Router();

authRouter.post('/login', AuthController.login); // pública: é aqui que se pega o token
authRouter.get('/me', autenticar, AuthController.me);
