// =====================================================================
// controllers/ViewFaltasAlunoController.js - lê req, chama o service, devolve res
// =====================================================================

import * as ViewFaltasAlunoService from '../services/ViewFaltasAlunoService.js';

// GET /api/faltas_aluno  (admin/professor)
export async function listar(req, res) {
  res.json(await ViewFaltasAlunoService.listar(req.query));
}

// GET /api/faltas_aluno/aluno/:id  (admin/professor)
export async function buscarPorAluno(req, res) {
  res.json(await ViewFaltasAlunoService.buscarPorAluno(req.params.id));
}

// GET /api/faltas_aluno/meu  (aluno logado: o id vem do TOKEN)
export async function meu(req, res) {
  res.json(await ViewFaltasAlunoService.buscarPorAluno(req.usuario.id_aluno));
}

export async function meuDetalhado(req, res) {
  res.json(await ViewFaltasAlunoService.buscarDetalhadoPorAluno(req.usuario.id_aluno));
}