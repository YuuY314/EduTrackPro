// =====================================================================
// routes/CalendarioEventoRoutes.js - Endpoints REST de "/calendario"
// =====================================================================

import express from 'express';
import * as CalendarioEventoController from '../controllers/CalendarioEventoController.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
let autenticar = (_req, _res, next) => next();
let autorizarAdmin = (_req, _res, next) => next();

export const calendarioEventoRouter = express.Router();

calendarioEventoRouter.get('/', CalendarioEventoController.listar);
calendarioEventoRouter.get('/:id', CalendarioEventoController.buscarPorId);
calendarioEventoRouter.post('/', (req, res, next) => autenticar(req, res, next), CalendarioEventoController.criar);
calendarioEventoRouter.put('/:id', (req, res, next) => autenticar(req, res, next), CalendarioEventoController.atualizar);
calendarioEventoRouter.delete('/:id', (req, res, next) => autenticar(req, res, next), CalendarioEventoController.excluir);

export function configurarSegurancaCalendarioEventos(middlewareAuth, middlewareAdmin) {
  // Substitui os middlewares provisórios da Sessão 1 pelos middlewares reais.
  if (middlewareAuth) autenticar = middlewareAuth;
  if (middlewareAdmin) autorizarAdmin = middlewareAdmin;
}