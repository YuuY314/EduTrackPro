import express from 'express';
import * as TarefaController from '../controllers/TarefaController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const tarefaRouter = express.Router();

tarefaRouter.get('/', TarefaController.listar);
tarefaRouter.get('/:id', TarefaController.buscarPorId);
tarefaRouter.post('/', (req, res, next) => autenticar(req, res, next), TarefaController.criar);
tarefaRouter.put('/:id', (req, res, next) => autenticar(req, res, next), TarefaController.atualizar);
// tarefaRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, TarefaController.enviarImagem);
tarefaRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), TarefaController.excluir);

export function configurarSegurancaTarefa(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
