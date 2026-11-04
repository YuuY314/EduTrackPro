import express from 'express';
import * as ProfessorController from '../controller/ProfessorController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const professorRoutes = express.Router();

professorRoutes.get('/', ProfessorController.listar);
professorRoutes.get('/:id', ProfessorController.buscarPorId);
professorRoutes.post('/', (req, res, next) => autenticar(req, res, next), ProfessorController.criar);
professorRoutes.put('/:id', (req, res, next) => autenticar(req, res, next), ProfessorController.atualizar);
// professorRoutes.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, ProfessorController.enviarImagem);
professorRoutes.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), ProfessorController.excluir);

export function configurarSegurancaAlunos(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
