// =====================================================================
// controller/avaliacoes.controller.js
// Avaliações e lançamento de notas (professor/admin).
// =====================================================================

import { paraId, paraIdOpcional } from "../utils/validacoes.js";

export function criarAvaliacoesController({ avaliacoesService }) {
  return {
    async criar(req, res) {
      res.status(201).json(await avaliacoesService.criar(req.usuario, req.body));
    },

    // Filtros opcionais na URL: /avaliacoes?turma=1&bimestre=3&tdp=2
    async listar(req, res) {
      const filtros = {
        idTurma: paraIdOpcional(req.query.turma, "turma"),
        idTdp: paraIdOpcional(req.query.tdp, "tdp"),
        bimestre: paraIdOpcional(req.query.bimestre, "bimestre"),
      };
      res.json(await avaliacoesService.listar(req.usuario, filtros));
    },

    async atualizar(req, res) {
      await avaliacoesService.atualizar(req.usuario, paraId(req.params.id), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await avaliacoesService.remover(req.usuario, paraId(req.params.id));
      res.status(204).end();
    },

    async listarNotas(req, res) {
      res.json(await avaliacoesService.listarNotas(req.usuario, paraId(req.params.id)));
    },
    async lancarNota(req, res) {
      const idAvaliacao = paraId(req.params.id);
      const idAluno = paraId(req.params.idAluno, "idAluno");
      await avaliacoesService.lancarNota(req.usuario, idAvaliacao, idAluno, req.body.valor);
      res.status(204).end();
    },
    async lancarNotasEmLote(req, res) {
      await avaliacoesService.lancarNotasEmLote(req.usuario, paraId(req.params.id), req.body.notas);
      res.status(204).end();
    },
  };
}
