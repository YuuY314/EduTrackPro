import express from 'express';
import * as TurmaDisciplinaProfessorController from '../controller/TurmaDisciplinaProfessorController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const turma_disciplina_professorRouter = express.Router();

turma_disciplina_professorRouter.get('/', TurmaDisciplinaProfessorController.listar);
turma_disciplina_professorRouter.get('/:id', TurmaDisciplinaProfessorController.buscarPorId);
turma_disciplina_professorRouter.post('/', (req, res, next) => autenticar(req, res, next), TurmaDisciplinaProfessorController.criar);
turma_disciplina_professorRouter.put('/:id', (req, res, next) => autenticar(req, res, next), TurmaDisciplinaProfessorController.atualizar);
// turma_disciplina_professorRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, TurmaDisciplinaProfessorController.enviarImagem);
turma_disciplina_professorRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), TurmaDisciplinaProfessorController.excluir);

export function configurarSegurancaTurmaDisciplinaProfessors(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
