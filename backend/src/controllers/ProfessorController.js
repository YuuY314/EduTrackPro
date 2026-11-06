// =====================================================================
// controllers/ProfessorController.js - lê req, chama o service, devolve res
// =====================================================================

import * as ProfessorService from '../services/ProfessorService.js';

export async function listar(req, res) {
  res.json(await ProfessorService.listar(req.query));
}

export async function buscarPorId(req, res) {
  res.json(await ProfessorService.buscarPorId(req.params.id));
}

export async function criar(req, res) {
  res.status(201).json(await ProfessorService.criar(req.body));
}

export async function atualizar(req, res) {
  res.json(await ProfessorService.atualizar(req.params.id, req.body));
}

export async function excluir(req, res) {
  await ProfessorService.excluir(req.params.id);
  res.status(204).send();
}
