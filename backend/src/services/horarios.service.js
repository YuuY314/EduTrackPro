// =====================================================================
// services/horarios.service.js
// Regras do cronograma semanal. Só o admin monta/edita; professor e
// aluno consultam.
// =====================================================================

import { AppError } from "../utils/AppError.js";

// Compara "HH:MM" com "HH:MM:SS" olhando só os 5 primeiros caracteres.
function fimDepoisDoInicio(inicio, fim) {
  return fim.slice(0, 5) > inicio.slice(0, 5);
}

export function criarHorariosService({ horariosModel, turmasModel, permissoes }) {
  async function obterHorario(id) {
    const h = await horariosModel.buscarPorId(id);
    if (!h) throw new AppError("Horário não encontrado", 404);
    return h;
  }

  return {
    // Cronograma de uma turma (admin e professor da turma).
    async listarDaTurma(usuario, idTurma) {
      await permissoes.garantirTurma(usuario, idTurma);
      return horariosModel.listarPorTurma(idTurma);
    },

    async criar(dados) {
      if (!(await turmasModel.buscarTdp(dados.id_tdp))) {
        throw new AppError("Disciplina da turma não encontrada", 404);
      }
      if (!fimDepoisDoInicio(dados.hora_inicio, dados.hora_fim)) {
        throw new AppError("hora_fim deve ser depois de hora_inicio", 400);
      }
      return { id: await horariosModel.criar(dados) };
    },

    async atualizar(id, campos) {
      const atual = await obterHorario(id);
      // Valida usando o valor novo se veio, senão o que já estava salvo.
      const inicio = campos.hora_inicio ?? atual.hora_inicio;
      const fim = campos.hora_fim ?? atual.hora_fim;
      if (!fimDepoisDoInicio(inicio, fim)) {
        throw new AppError("hora_fim deve ser depois de hora_inicio", 400);
      }
      await horariosModel.atualizar(id, campos);
    },

    async remover(id) {
      await obterHorario(id);
      await horariosModel.remover(id);
    },
  };
}
