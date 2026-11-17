import express from 'express';
import * as HorarioAulaController from '../controllers/HorarioAulaController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const horarioAulaRouter = express.Router();

horarioAulaRouter.get('/', HorarioAulaController.listar);
horarioAulaRouter.get('/:id', HorarioAulaController.buscarPorId);
horarioAulaRouter.post('/', (req, res, next) => autenticar(req, res, next), HorarioAulaController.criar);
horarioAulaRouter.put('/:id', (req, res, next) => autenticar(req, res, next), HorarioAulaController.atualizar);
// horarioAulaRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, HorarioAulaController.enviarImagem);
horarioAulaRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), HorarioAulaController.excluir);

export function configurarSegurancaHorarioAulas(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
