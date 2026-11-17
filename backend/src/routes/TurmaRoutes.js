import express from 'express';
import * as TurmaController from '../controllers/TurmaController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const turmaRouter = express.Router();

turmaRouter.get('/', TurmaController.listar);
turmaRouter.get('/:id', TurmaController.buscarPorId);
turmaRouter.post('/', (req, res, next) => autenticar(req, res, next), TurmaController.criar);
turmaRouter.put('/:id', (req, res, next) => autenticar(req, res, next), TurmaController.atualizar);
// turmaRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, TurmaController.enviarImagem);
turmaRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), TurmaController.excluir);

export function configurarSegurancaTurmas(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
