// =====================================================================
// controller/alunos.controller.js
// Dois grupos de handlers:
//   - "me*": área do aluno. O id vem do TOKEN (req.usuario.id_aluno),
//     NUNCA da URL, para um aluno não conseguir ver dados de outro.
//   - cadastro: usado pelo admin (o id vem da URL).
// =====================================================================

import { paraId } from "../utils/validacoes.js";

export function criarAlunosController({ alunosService }) {
  return {
    // ---------------------- área do aluno ----------------------
    async minhaFicha(req, res) {
      res.json(await alunosService.ficha(req.usuario.id_aluno));
    },
    async home(req, res) {
      res.json(await alunosService.home(req.usuario.id_aluno));
    },
    async meusHorarios(req, res) {
      res.json(await alunosService.horarios(req.usuario.id_aluno));
    },
    async meuBoletim(req, res) {
      res.json(await alunosService.boletim(req.usuario.id_aluno));
    },
    async minhaFrequencia(req, res) {
      res.json(await alunosService.frequencia(req.usuario.id_aluno));
    },
    async minhasTarefas(req, res) {
      res.json(await alunosService.tarefas(req.usuario.id_aluno));
    },
    async meusAvisos(req, res) {
      res.json(await alunosService.avisos(req.usuario.id_aluno));
    },

    // ---------------------- cadastro (admin) ----------------------
    async listar(req, res) {
      res.json(await alunosService.listar());
    },
    async buscar(req, res) {
      res.json(await alunosService.ficha(paraId(req.params.id)));
    },
    async criar(req, res) {
      const criado = await alunosService.criar(req.body);
      res.status(201).json(criado); // 201 = criado com sucesso
    },
    async atualizar(req, res) {
      await alunosService.atualizar(paraId(req.params.id), req.body);
      res.status(204).end();
    },
    async remover(req, res) {
      await alunosService.remover(paraId(req.params.id));
      res.status(204).end();
    },
  };
}
