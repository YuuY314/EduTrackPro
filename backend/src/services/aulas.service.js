// =====================================================================
// services/aulas.service.js
// Regras de aulas e chamada (presença/falta).
//
// Fluxo do professor: 1) registra a aula do dia (POST /aulas);
// 2) faz a chamada (PUT /aulas/:id/frequencias).
// =====================================================================

import { AppError } from "../utils/AppError.js";

export function criarAulasService({ aulasModel, alunosModel, permissoes }) {
  async function obterComPermissao(usuario, idAula) {
    const aula = await aulasModel.buscarPorId(idAula);
    if (!aula) throw new AppError("Aula não encontrada", 404);
    await permissoes.garantirTdp(usuario, aula.id_tdp);
    return aula;
  }

  async function idsDosAlunosDaTurma(idTurma) {
    const alunos = await alunosModel.listarPorTurma(idTurma);
    return new Set(alunos.map((a) => a.id_aluno));
  }

  return {
    async criar(usuario, dados) {
      await permissoes.garantirTdp(usuario, dados.id_tdp);
      return { id_aula: await aulasModel.criar(dados) };
    },

    listar(usuario, { idTurma, idTdp, data }) {
      const idProfessor = usuario.perfil === "professor" ? usuario.id_professor : null;
      return aulasModel.listar({ idTurma, idTdp, data, idProfessor });
    },

    // Tela de chamada: alunos da turma e situação de cada um.
    // presente: true / false / null (null = chamada ainda não feita).
    async listarFrequencias(usuario, idAula) {
      const aula = await obterComPermissao(usuario, idAula);
      const alunos = await aulasModel.listarFrequencias(idAula);
      return {
        aula: { id_aula: aula.id_aula, data: aula.data, disciplina: aula.disciplina },
        alunos: alunos.map((a) => ({
          id_aluno: a.id_aluno,
          nome: a.nome,
          // O MySQL guarda boolean como 0/1; convertemos de volta (mantendo null).
          presente: a.presente === null ? null : Boolean(a.presente),
          justificativa: a.justificativa,
        })),
      };
    },

    // Chamada completa de uma vez.
    async salvarChamada(usuario, idAula, lista) {
      const aula = await obterComPermissao(usuario, idAula);
      const ids = await idsDosAlunosDaTurma(aula.id_turma);

      const intrusos = lista.filter((f) => !ids.has(f.id_aluno)).map((f) => f.id_aluno);
      if (intrusos.length > 0) {
        throw new AppError(`Alunos que não pertencem a esta turma: ${intrusos.join(", ")}`, 422);
      }
      await aulasModel.salvarFrequencias(idAula, lista);
    },

    // Marca/ajusta a presença de um aluno só (ex.: corrigir uma falta).
    async ajustarFrequencia(usuario, idAula, idAluno, { presente, justificativa }) {
      const aula = await obterComPermissao(usuario, idAula);
      const ids = await idsDosAlunosDaTurma(aula.id_turma);
      if (!ids.has(idAluno)) throw new AppError("Aluno não pertence a esta turma", 422);
      await aulasModel.salvarFrequencia(idAula, idAluno, presente, justificativa);
    },
  };
}
