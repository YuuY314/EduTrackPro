// =====================================================================
// controller/horarios.controller.js
// Cronograma semanal. A consulta usa um filtro na URL: GET /horarios?turma=1
// (req.query traz o que vem depois do "?").
// =====================================================================

import { paraId } from "../utils/validacoes.js";

export function criarHorariosController({ horariosService }) {
  return {
    async listar(req, res) {
      const idTurma = paraId(req.query.turma, "turma"); // obrigatório
      res.json(await horariosService.listarDaTurma(req.usuario, idTurma));
    },
    async criar(req, res) {
      res.status(201).json(await horariosService.criar(req.body));
    },
    async atualizar(req, res) {
      await horariosService.atualizar(paraId(req.params.id), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await horariosService.remover(paraId(req.params.id));
      res.status(204).end();
    },
  };
}
