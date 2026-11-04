import express from 'express';
import * as UsuarioController from '../controller/UsuarioController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const usuarioRouter = express.Router();

usuarioRouter.get('/', UsuarioController.listar);
usuarioRouter.get('/:id', UsuarioController.buscarPorId);
usuarioRouter.post('/', (req, res, next) => autenticar(req, res, next), UsuarioController.criar);
usuarioRouter.put('/:id', (req, res, next) => autenticar(req, res, next), UsuarioController.atualizar);
// usuarioRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, UsuarioController.enviarImagem);
usuarioRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), UsuarioController.excluir);

export function configurarSegurancaAlunos(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
