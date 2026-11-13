import express from 'express';
import * as AulaController from '../controller/AulaController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const aulaRouter = express.Router();

aulaRouter.get('/', AulaController.listar);
aulaRouter.get('/:id', AulaController.buscarPorId);
aulaRouter.post('/', (req, res, next) => autenticar(req, res, next), AulaController.criar);
aulaRouter.put('/:id', (req, res, next) => autenticar(req, res, next), AulaController.atualizar);
// aulaRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, AulaController.enviarImagem);
aulaRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), AulaController.excluir);

export function configurarSegurancaAulas(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
