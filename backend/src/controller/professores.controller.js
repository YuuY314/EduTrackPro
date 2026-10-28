// =====================================================================
// controller/professores.controller.js
// "me*": painel do professor (id do token). Demais: cadastro (admin).
// =====================================================================

import { paraId } from "../utils/validacoes.js";

export function criarProfessoresController({ professoresService }) {
  return {
    async minhasTurmas(req, res) {
      res.json(await professoresService.minhasTurmas(req.usuario.id_professor));
    },
    async meusHorarios(req, res) {
      res.json(await professoresService.meusHorarios(req.usuario.id_professor));
    },

    async listar(req, res) {
      res.json(await professoresService.listar());
    },
    async buscar(req, res) {
      res.json(await professoresService.buscar(paraId(req.params.id)));
    },
    async criar(req, res) {
      res.status(201).json(await professoresService.criar(req.body));
    },
    async atualizar(req, res) {
      await professoresService.atualizar(paraId(req.params.id), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await professoresService.remover(paraId(req.params.id));
      res.status(204).end();
    },
  };
}
