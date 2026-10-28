// =====================================================================
// services/permissoes.service.js
// CAMADA SERVICE = regras de negócio. Aqui ficam as perguntas:
//   "esse professor pode mexer NESSA turma / NESSA disciplina?"
//
// Vários services precisam dessa checagem, então ela mora num só lugar.
// Regra geral: admin pode tudo; professor só o que leciona; aluno nada
// (aluno só usa as rotas /alunos/me/*).
// =====================================================================

import { AppError } from "../utils/AppError.js";

export function criarPermissoesService({ turmasModel }) {
  return {
    // Garante que a turma EXISTE e que o usuário pode acessá-la.
    // Devolve a turma (para o chamador reaproveitar).
    async garantirTurma(usuario, idTurma) {
      const turma = await turmasModel.buscarPorId(idTurma);
      if (!turma) throw new AppError("Turma não encontrada", 404);

      if (usuario.perfil === "admin") return turma;

      if (usuario.perfil === "professor") {
        const leciona = await turmasModel.professorLecionaNaTurma(usuario.id_professor, idTurma);
        if (leciona) return turma;
      }
      throw new AppError("Você não leciona nesta turma", 403);
    },

    // Garante que o tdp (turma + disciplina + professor) EXISTE e que o
    // usuário é o professor responsável por ele (ou admin).
    // É isso que impede um professor de lançar nota em disciplina alheia.
    async garantirTdp(usuario, idTdp) {
      const tdp = await turmasModel.buscarTdp(idTdp);
      if (!tdp) throw new AppError("Disciplina da turma não encontrada", 404);

      if (usuario.perfil === "admin") return tdp;

      if (usuario.perfil === "professor") {
        const dono = await turmasModel.professorDonoDoTdp(usuario.id_professor, idTdp);
        if (dono) return tdp;
      }
      throw new AppError("Você não leciona esta disciplina nesta turma", 403);
    },
  };
}
