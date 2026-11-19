import express from 'express';
import * as GmailAPIController from '../controllers/GmailAPIController.js';

let autenticar = (_req, _res, next) => next();

export const gmailAPIRouter = express.Router();

gmailAPIRouter.post(
    '/enviar',
    (req, res, next) => autenticar(req, res, next),
    GmailAPIController.enviar
);

gmailAPIRouter.post(
    '/recuperar-senha',
    GmailAPIController.enviarRecuperacao
);

export function configurarSegurancaEmails(middlewareAuth) {
    if (middlewareAuth) {
        autenticar = middlewareAuth;
    }
}