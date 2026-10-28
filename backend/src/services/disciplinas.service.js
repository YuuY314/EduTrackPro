// =====================================================================
// services/disciplinas.service.js
// Catálogo de disciplinas. Qualquer usuário logado lista; só o admin altera.
// =====================================================================

import { AppError } from "../utils/AppError.js";

export function criarDisciplinasService({ disciplinasModel }) {
  async function obter(id) {
    const d = await disciplinasModel.buscarPorId(id);
    if (!d) throw new AppError("Disciplina não encontrada", 404);
    return d;
  }

  return {
    listar() {
      return disciplinasModel.listar();
    },

    async criar({ nome }) {
      return { id_disciplina: await disciplinasModel.criar(nome) };
    },

    async atualizar(id, { nome }) {
      await obter(id);
      await disciplinasModel.atualizar(id, nome);
    },

    async remover(id) {
      await obter(id);
      await disciplinasModel.remover(id); // 409 se ainda estiver em uso numa turma
    },
  };
}
