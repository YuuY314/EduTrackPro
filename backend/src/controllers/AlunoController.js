// =====================================================================
// controllers/AlunoController.js - lê req, chama o service, devolve res
//
// Antes cada função tinha try/catch + responderErro() copiado em todos
// os controllers. No Express 5 isso é desnecessário: o erro lançado no
// service (AppError) chega sozinho no middlewares/errorHandler.js.
// =====================================================================

import * as AlunoService from '../services/AlunoService.js';

export async function listar(req, res) {
  res.json(await AlunoService.listar(req.query));
}

export async function buscarPorId(req, res) {
  res.json(await AlunoService.buscarPorId(req.params.id));
}

export async function criar(req, res) {
  res.status(201).json(await AlunoService.criar(req.body));
}

export async function atualizar(req, res) {
  res.json(await AlunoService.atualizar(req.params.id, req.body));
}

export async function excluir(req, res) {
  await AlunoService.excluir(req.params.id);
  res.status(204).send();
}
