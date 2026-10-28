// =====================================================================
// controller/turmas.controller.js
// Turmas, alunos da turma ("entrar no aluno") e disciplinas da turma.
// =====================================================================

import { paraId } from "../utils/validacoes.js";

export function criarTurmasController({ turmasService }) {
  return {
    async listar(req, res) {
      res.json(await turmasService.listar(req.usuario));
    },
    async buscar(req, res) {
      res.json(await turmasService.buscar(req.usuario, paraId(req.params.idTurma, "idTurma")));
    },
    async listarAlunos(req, res) {
      res.json(await turmasService.listarAlunos(req.usuario, paraId(req.params.idTurma, "idTurma")));
    },
    async detalheDoAluno(req, res) {
      const idTurma = paraId(req.params.idTurma, "idTurma");
      const idAluno = paraId(req.params.idAluno, "idAluno");
      res.json(await turmasService.detalheDoAluno(req.usuario, idTurma, idAluno));
    },

    async criar(req, res) {
      res.status(201).json(await turmasService.criar(req.body));
    },
    async atualizar(req, res) {
      await turmasService.atualizar(paraId(req.params.idTurma, "idTurma"), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await turmasService.remover(paraId(req.params.idTurma, "idTurma"));
      res.status(204).end();
    },

    async listarDisciplinas(req, res) {
      const idTurma = paraId(req.params.idTurma, "idTurma");
      res.json(await turmasService.listarDisciplinas(req.usuario, idTurma));
    },
    async atribuirDisciplina(req, res) {
      const idTurma = paraId(req.params.idTurma, "idTurma");
      res.status(201).json(await turmasService.atribuirDisciplina(idTurma, req.body));
    },
    async removerDisciplina(req, res) {
      const idTurma = paraId(req.params.idTurma, "idTurma");
      const idTdp = paraId(req.params.idTdp, "idTdp");
      await turmasService.removerDisciplina(idTurma, idTdp);
      res.status(204).end();
    },
  };
}
