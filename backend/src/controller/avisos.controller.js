// =====================================================================
// controller/avisos.controller.js
// =====================================================================

import { paraId, paraIdOpcional } from "../utils/validacoes.js";

export function criarAvisosController({ avisosService }) {
  return {
    async criar(req, res) {
      res.status(201).json(await avisosService.criar(req.usuario, req.body));
    },
    // /avisos  ou  /avisos?turma=1
    async listar(req, res) {
      const idTurma = paraIdOpcional(req.query.turma, "turma");
      res.json(await avisosService.listar(req.usuario, idTurma));
    },
    async atualizar(req, res) {
      await avisosService.atualizar(req.usuario, paraId(req.params.id), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await avisosService.remover(req.usuario, paraId(req.params.id));
      res.status(204).end();
    },
  };
}
