import express from 'express';
import * as FrequenciaController from '../controllers/FrequenciaController.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const frequenciaRouter = express.Router();

frequenciaRouter.get('/', FrequenciaController.listar);
frequenciaRouter.get('/:id', FrequenciaController.buscarPorId);
frequenciaRouter.post('/', (req, res, next) => autenticar(req, res, next), FrequenciaController.criar);
frequenciaRouter.put('/:id', (req, res, next) => autenticar(req, res, next), FrequenciaController.atualizar);
// frequenciaRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, FrequenciaController.enviarImagem);
frequenciaRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), (req, res, next) => autorizarAdmin(req, res, next), FrequenciaController.excluir);

export function configurarSegurancaFrequencias(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}
