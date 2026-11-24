// =====================================================================
// routes/GmailAPIRoutes.js - /api/email
// Envio livre de e-mail pela conta da escola: só admin.
//
// A antiga rota pública POST /api/email/recuperar-senha foi removida:
// ela deixava qualquer pessoa disparar e-mails "oficiais" para qualquer
// endereço. A recuperação de verdade é POST /api/auth/recuperar-senha,
// que só envia para o e-mail cadastrado da conta.
// =====================================================================

import { Router } from 'express';
import * as GmailAPIController from '../controllers/GmailAPIController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';

export const gmailAPIRouter = Router();
gmailAPIRouter.use(autenticar, exigirPerfil('admin'));

gmailAPIRouter.post('/enviar', GmailAPIController.enviar);
