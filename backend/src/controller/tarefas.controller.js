// =====================================================================
// controller/tarefas.controller.js
// =====================================================================

import { paraId } from "../utils/validacoes.js";

export function criarTarefasController({ tarefasService }) {
  return {
    async criar(req, res) {
      res.status(201).json(await tarefasService.criar(req.usuario, req.body));
    },
    // /tarefas?turma=1  (o parâmetro "turma" é obrigatório)
    async listar(req, res) {
      res.json(await tarefasService.listar(req.usuario, paraId(req.query.turma, "turma")));
    },
    async atualizar(req, res) {
      await tarefasService.atualizar(req.usuario, paraId(req.params.id), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await tarefasService.remover(req.usuario, paraId(req.params.id));
      res.status(204).end();
    },
  };
}
