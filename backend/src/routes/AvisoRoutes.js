import express from 'express';
import * as AvisoController from '../controllers/AvisoController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const avisoRouter = express.Router();

avisoRouter.get('/', AvisoController.listar);
avisoRouter.get('/:id', AvisoController.buscarPorId);
avisoRouter.post('/', (req, res, next) => autenticar(req, res, next), AvisoController.criar);
avisoRouter.put('/:id', (req, res, next) => autenticar(req, res, next), AvisoController.atualizar);
// avisoRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, AvisoController.enviarImagem);
avisoRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), AvisoController.excluir);

export function configurarSegurancaAvisos(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
