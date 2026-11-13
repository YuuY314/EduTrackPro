import express from 'express';
import * as AvaliacaoController from '../controller/AvaliacaoController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const avaliacaoRouter = express.Router();

avaliacaoRouter.get('/', AvaliacaoController.listar);
avaliacaoRouter.get('/:id', AvaliacaoController.buscarPorId);
avaliacaoRouter.post('/', (req, res, next) => autenticar(req, res, next), AvaliacaoController.criar);
avaliacaoRouter.put('/:id', (req, res, next) => autenticar(req, res, next), AvaliacaoController.atualizar);
// avaliacaoRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, AvaliacaoController.enviarImagem);
avaliacaoRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), AvaliacaoController.excluir);

export function configurarSegurancaAvaliacaos(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
