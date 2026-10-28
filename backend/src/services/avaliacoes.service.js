// =====================================================================
// services/avaliacoes.service.js
// Regras de avaliações e lançamento de notas.
//
// Toda operação confere duas coisas:
//   1) o professor é dono da disciplina daquela turma (permissoes.garantirTdp);
//   2) o aluno da nota realmente é daquela turma.
// =====================================================================

import { AppError } from "../utils/AppError.js";

export function criarAvaliacoesService({ avaliacoesModel, alunosModel, permissoes }) {
  // Busca a avaliação e já confirma que o usuário pode mexer nela.
  async function obterComPermissao(usuario, idAvaliacao) {
    const av = await avaliacoesModel.buscarPorId(idAvaliacao);
    if (!av) throw new AppError("Avaliação não encontrada", 404);
    await permissoes.garantirTdp(usuario, av.id_tdp);
    return av;
  }

  // Ids de todos os alunos da turma (para validar as notas recebidas).
  async function idsDosAlunosDaTurma(idTurma) {
    const alunos = await alunosModel.listarPorTurma(idTurma);
    return new Set(alunos.map((a) => a.id_aluno));
  }

  return {
    async criar(usuario, dados) {
      await permissoes.garantirTdp(usuario, dados.id_tdp);
      return { id_avaliacao: await avaliacoesModel.criar(dados) };
    },

    // Professor: só as avaliações das disciplinas dele. Admin: todas.
    listar(usuario, { idTurma, idTdp, bimestre }) {
      const idProfessor = usuario.perfil === "professor" ? usuario.id_professor : null;
      return avaliacoesModel.listar({ idTurma, idTdp, bimestre, idProfessor });
    },

    async atualizar(usuario, idAvaliacao, campos) {
      await obterComPermissao(usuario, idAvaliacao);
      await avaliacoesModel.atualizar(idAvaliacao, campos);
    },

    async remover(usuario, idAvaliacao) {
      await obterComPermissao(usuario, idAvaliacao);
      await avaliacoesModel.remover(idAvaliacao);
    },

    // Todos os alunos da turma com a nota atual (ou null).
    async listarNotas(usuario, idAvaliacao) {
      const av = await obterComPermissao(usuario, idAvaliacao);
      const alunos = await avaliacoesModel.listarNotas(idAvaliacao);
      return {
        avaliacao: {
          id_avaliacao: av.id_avaliacao,
          titulo: av.titulo,
          disciplina: av.disciplina,
          bimestre: av.bimestre,
          peso: av.peso,
        },
        alunos: alunos.map((a) => ({ id_aluno: a.id_aluno, nome: a.nome, nota: a.valor })),
      };
    },

    // Lança (ou corrige) a nota de UM aluno.
    async lancarNota(usuario, idAvaliacao, idAluno, valor) {
      const av = await obterComPermissao(usuario, idAvaliacao);
      const ids = await idsDosAlunosDaTurma(av.id_turma);
      if (!ids.has(idAluno)) throw new AppError("Aluno não pertence a esta turma", 422);
      await avaliacoesModel.salvarNota(idAvaliacao, idAluno, valor);
    },

    // Lança notas de VÁRIOS alunos de uma vez. Se um aluno for inválido,
    // nada é salvo (validamos tudo antes de gravar).
    async lancarNotasEmLote(usuario, idAvaliacao, notas) {
      const av = await obterComPermissao(usuario, idAvaliacao);
      const ids = await idsDosAlunosDaTurma(av.id_turma);

      const intrusos = notas.filter((n) => !ids.has(n.id_aluno)).map((n) => n.id_aluno);
      if (intrusos.length > 0) {
        throw new AppError(`Alunos que não pertencem a esta turma: ${intrusos.join(", ")}`, 422);
      }
      await avaliacoesModel.salvarNotasEmLote(idAvaliacao, notas);
    },
  };
}
