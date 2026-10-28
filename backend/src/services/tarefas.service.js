// =====================================================================
// services/tarefas.service.js
// Regras de tarefas. O aluno consulta pela rota /alunos/me/tarefas;
// aqui ficam as operações do professor/admin.
// =====================================================================

import { AppError } from "../utils/AppError.js";

export function criarTarefasService({ tarefasModel, permissoes }) {
  async function obterComPermissao(usuario, idTarefa) {
    const tarefa = await tarefasModel.buscarPorId(idTarefa);
    if (!tarefa) throw new AppError("Tarefa não encontrada", 404);
    await permissoes.garantirTdp(usuario, tarefa.id_tdp);
    return tarefa;
  }

  return {
    async criar(usuario, dados) {
      await permissoes.garantirTdp(usuario, dados.id_tdp);
      return { id_tarefa: await tarefasModel.criar(dados) };
    },

    // Tarefas de uma turma. Professor vê as das disciplinas dele.
    async listar(usuario, idTurma) {
      await permissoes.garantirTurma(usuario, idTurma);
      const idProfessor = usuario.perfil === "professor" ? usuario.id_professor : null;
      return tarefasModel.listarPorTurma(idTurma, idProfessor);
    },

    async atualizar(usuario, idTarefa, campos) {
      await obterComPermissao(usuario, idTarefa);
      await tarefasModel.atualizar(idTarefa, campos);
    },

    async remover(usuario, idTarefa) {
      await obterComPermissao(usuario, idTarefa);
      await tarefasModel.remover(idTarefa);
    },
  };
}
