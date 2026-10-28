// =====================================================================
// services/avisos.service.js
// Regras de avisos:
//   - Professor publica só para turmas em que leciona.
//   - Admin publica para uma turma OU para todas (id_turma omitido).
//   - Só o autor (ou admin) edita/remove um aviso.
// =====================================================================

import { AppError } from "../utils/AppError.js";

export function criarAvisosService({ avisosModel, permissoes }) {
  async function obter(idAviso) {
    const aviso = await avisosModel.buscarPorId(idAviso);
    if (!aviso) throw new AppError("Aviso não encontrado", 404);
    return aviso;
  }

  // Autor ou admin.
  function garantirAutoria(usuario, aviso) {
    if (usuario.perfil !== "admin" && aviso.id_autor !== usuario.id_usuario) {
      throw new AppError("Apenas quem publicou o aviso pode alterá-lo", 403);
    }
  }

  return {
    async criar(usuario, { titulo, texto, id_turma }) {
      if (usuario.perfil === "professor" && !id_turma) {
        throw new AppError("Informe a turma do aviso (id_turma)", 400);
      }
      // Se há turma, confirma que ela existe e que o usuário pode usá-la.
      if (id_turma) await permissoes.garantirTurma(usuario, id_turma);

      const idAviso = await avisosModel.criar({
        id_autor: usuario.id_usuario,
        id_turma: id_turma ?? null, // null = aviso geral
        titulo,
        texto,
      });
      return { id_aviso: idAviso };
    },

    // Professor: gerais + das turmas dele. Admin: tudo (filtro opcional).
    async listar(usuario, idTurma) {
      if (usuario.perfil === "admin") return avisosModel.listarTodos(idTurma);

      const avisos = await avisosModel.listarParaProfessor(usuario.id_professor);
      if (!idTurma) return avisos;
      // Com filtro: mantém os da turma pedida + os gerais.
      return avisos.filter((a) => a.id_turma === idTurma || a.id_turma === null);
    },

    async atualizar(usuario, idAviso, campos) {
      garantirAutoria(usuario, await obter(idAviso));
      await avisosModel.atualizar(idAviso, campos);
    },

    async remover(usuario, idAviso) {
      garantirAutoria(usuario, await obter(idAviso));
      await avisosModel.remover(idAviso);
    },
  };
}
