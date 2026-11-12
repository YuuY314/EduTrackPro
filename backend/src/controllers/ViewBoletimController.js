// =====================================================================
// controllers/ViewBoletimController.js - lê req, chama o service, devolve res
// (Express 5: erros do service chegam sozinhos no errorHandler)
// =====================================================================

import * as ViewBoletimService from '../services/ViewBoletimService.js';

// GET /api/boletim  (admin/professor)
export async function listar(req, res) {
  res.json(await ViewBoletimService.listar(req.query));
}

// GET /api/boletim/aluno/:id  (admin/professor)
export async function buscarPorAluno(req, res) {
  res.json(await ViewBoletimService.buscarPorAluno(req.params.id));
}

// GET /api/boletim/meu  (aluno logado: o id vem do TOKEN, não da URL)
export async function meu(req, res) {
  res.json(await ViewBoletimService.buscarPorAluno(req.usuario.id_aluno));
}