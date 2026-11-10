import express from 'express';
import * as DisciplinaController from '../controllers/DisciplinaController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const disciplinaRouter = express.Router();

disciplinaRouter.get('/', DisciplinaController.listar);
disciplinaRouter.get('/:id', DisciplinaController.buscarPorId);
disciplinaRouter.post('/', (req, res, next) => autenticar(req, res, next), DisciplinaController.criar);
disciplinaRouter.put('/:id', (req, res, next) => autenticar(req, res, next), DisciplinaController.atualizar);
// disciplinaRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, DisciplinaController.enviarImagem);
disciplinaRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), DisciplinaController.excluir);

export function configurarSegurancaDisciplinas(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
