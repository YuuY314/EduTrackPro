// =====================================================================
// services/professores.service.js
// Regras do painel do professor (/professores/me/*) e do cadastro (admin).
// =====================================================================

import { AppError } from "../utils/AppError.js";
import { gerarHash } from "../utils/senha.js";
import { agruparTurmas } from "../utils/agrupar.js";

export function criarProfessoresService({ professoresModel, turmasModel, horariosModel }) {
  async function obterProfessor(id) {
    const p = await professoresModel.buscarPorId(id);
    if (!p) throw new AppError("Professor não encontrado", 404);
    return p;
  }

  return {
    // ====================== painel do professor ======================

    // As turmas em que ele leciona (3A, 3B...), cada uma com as
    // disciplinas dele nela. O "id_tdp" é o que o front envia depois
    // para criar avaliações, aulas e tarefas.
    async minhasTurmas(idProfessor) {
      return agruparTurmas(await turmasModel.listarDoProfessor(idProfessor));
    },

    meusHorarios(idProfessor) {
      return horariosModel.listarPorProfessor(idProfessor);
    },

    // ========================= cadastro (admin) =========================

    listar() {
      return professoresModel.listar();
    },

    buscar(id) {
      return obterProfessor(id);
    },

    async criar(dados) {
      const idProfessor = await professoresModel.criar({
        ...dados,
        senhaHash: await gerarHash(dados.senha),
      });
      return { id_professor: idProfessor };
    },

    async atualizar(id, campos) {
      await obterProfessor(id);
      await professoresModel.atualizar(id, campos);
    },

    async remover(id) {
      await obterProfessor(id);
      await professoresModel.remover(id);
    },
  };
}
