import express from 'express';
import * as ResponsavelController from '../controllers/ResponsavelController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const responsavelRouter = express.Router();

responsavelRouter.get('/', ResponsavelController.listar);
responsavelRouter.get('/:id', ResponsavelController.buscarPorId);
responsavelRouter.post('/', (req, res, next) => autenticar(req, res, next), ResponsavelController.criar);
responsavelRouter.put('/:id', (req, res, next) => autenticar(req, res, next), ResponsavelController.atualizar);
// responsavelRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, ResponsavelController.enviarImagem);
responsavelRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), ResponsavelController.excluir);

export function configurarSegurancaResponsavel(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
