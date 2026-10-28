// =====================================================================
// controller/disciplinas.controller.js
// =====================================================================

import { paraId } from "../utils/validacoes.js";

export function criarDisciplinasController({ disciplinasService }) {
  return {
    async listar(req, res) {
      res.json(await disciplinasService.listar());
    },
    async criar(req, res) {
      res.status(201).json(await disciplinasService.criar(req.body));
    },
    async atualizar(req, res) {
      await disciplinasService.atualizar(paraId(req.params.id), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await disciplinasService.remover(paraId(req.params.id));
      res.status(204).end();
    },
  };
}
