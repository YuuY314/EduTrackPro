// =====================================================================
// controller/aulas.controller.js
// Aulas e chamada (frequência).
// =====================================================================

import { paraId, paraIdOpcional } from "../utils/validacoes.js";

export function criarAulasController({ aulasService }) {
  return {
    async criar(req, res) {
      res.status(201).json(await aulasService.criar(req.usuario, req.body));
    },

    // Filtros opcionais: /aulas?turma=1&data=2026-10-19&tdp=2
    async listar(req, res) {
      const filtros = {
        idTurma: paraIdOpcional(req.query.turma, "turma"),
        idTdp: paraIdOpcional(req.query.tdp, "tdp"),
        data: req.query.data || null,
      };
      res.json(await aulasService.listar(req.usuario, filtros));
    },

    async listarFrequencias(req, res) {
      res.json(await aulasService.listarFrequencias(req.usuario, paraId(req.params.id)));
    },
    async salvarChamada(req, res) {
      await aulasService.salvarChamada(req.usuario, paraId(req.params.id), req.body.frequencias);
      res.status(204).end();
    },
    async ajustarFrequencia(req, res) {
      const idAula = paraId(req.params.id);
      const idAluno = paraId(req.params.idAluno, "idAluno");
      await aulasService.ajustarFrequencia(req.usuario, idAula, idAluno, req.body);
      res.status(204).end();
    },
  };
}
