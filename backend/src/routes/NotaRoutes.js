import express from 'express';
import * as NotaController from '../controllers/NotaController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const notaRouter = express.Router();

notaRouter.get('/', NotaController.listar);
notaRouter.get('/:id', NotaController.buscarPorId);
notaRouter.post('/', (req, res, next) => autenticar(req, res, next), NotaController.criar);
notaRouter.put('/:id', (req, res, next) => autenticar(req, res, next), NotaController.atualizar);
// notaRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, NotaController.enviarImagem);
notaRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), NotaController.excluir);

export function configurarSegurancaNotas(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
