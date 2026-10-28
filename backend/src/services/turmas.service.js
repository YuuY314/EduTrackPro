// =====================================================================
// services/turmas.service.js
// Regras de turmas: quem pode ver o quê, "entrar no aluno" e a
// atribuição de disciplinas/professores a cada turma.
// =====================================================================

import { AppError } from "../utils/AppError.js";
import { agruparTurmas } from "../utils/agrupar.js";

export function criarTurmasService({ turmasModel, alunosModel, alunosService, permissoes }) {
  async function obterTurma(idTurma) {
    const t = await turmasModel.buscarPorId(idTurma);
    if (!t) throw new AppError("Turma não encontrada", 404);
    return t;
  }

  return {
    // Admin vê todas as turmas; professor vê só as dele.
    async listar(usuario) {
      if (usuario.perfil === "admin") return turmasModel.listarTodas();
      return agruparTurmas(await turmasModel.listarDoProfessor(usuario.id_professor));
    },

    buscar(usuario, idTurma) {
      return permissoes.garantirTurma(usuario, idTurma);
    },

    // Lista de alunos da turma (o professor só vê turmas em que leciona).
    async listarAlunos(usuario, idTurma) {
      await permissoes.garantirTurma(usuario, idTurma);
      return alunosModel.listarPorTurma(idTurma);
    },

    // "ENTRAR NO ALUNO": ficha + notas + faltas.
    // Professor: só vê notas/faltas das disciplinas DELE e não vê CPF
    // nem endereço (dados que ele não precisa para o trabalho).
    // Admin: vê tudo.
    async detalheDoAluno(usuario, idTurma, idAluno) {
      await permissoes.garantirTurma(usuario, idTurma);

      const ficha = await alunosService.ficha(idAluno); // 404 se não existe
      if (ficha.turma.id_turma !== idTurma) {
        throw new AppError("Aluno não pertence a esta turma", 404);
      }

      const ehProfessor = usuario.perfil === "professor";
      const filtro = ehProfessor ? usuario.id_professor : null;

      const [boletim, frequencia] = await Promise.all([
        alunosService.boletim(idAluno, filtro),
        alunosService.frequencia(idAluno, filtro),
      ]);

      if (ehProfessor) {
        // Remove campos sensíveis. O "_" na frente indica "variável que não vou usar".
        const { cpf: _cpf, endereco: _end, responsavel, ...resto } = ficha;
        const { cpf: _rcpf, ...responsavelSemCpf } = responsavel;
        return { ...resto, responsavel: responsavelSemCpf, boletim, frequencia };
      }
      return { ...ficha, boletim, frequencia };
    },

    // ---------------------------- admin ----------------------------

    async criar(dados) {
      return { id_turma: await turmasModel.criar(dados) };
    },

    async atualizar(idTurma, campos) {
      await obterTurma(idTurma);
      await turmasModel.atualizar(idTurma, campos);
    },

    async remover(idTurma) {
      await obterTurma(idTurma);
      await turmasModel.remover(idTurma); // falha com 409 se ainda tiver alunos
    },

    // ----------------- disciplinas (tdp) da turma -----------------

    async listarDisciplinas(usuario, idTurma) {
      await permissoes.garantirTurma(usuario, idTurma);
      return turmasModel.listarDisciplinasDaTurma(idTurma);
    },

    // Define "o professor X dá a disciplina Y na turma Z".
    // O banco impede duplicar (turma + disciplina), devolvendo 409.
    async atribuirDisciplina(idTurma, { id_disciplina, id_professor }) {
      await obterTurma(idTurma);
      const idTdp = await turmasModel.atribuirDisciplina(idTurma, id_disciplina, id_professor);
      return { id_tdp: idTdp };
    },

    // CUIDADO: apagar um tdp apaga também horários, aulas, avaliações e
    // tarefas ligados a ele (cascata definida no banco).
    async removerDisciplina(idTurma, idTdp) {
      const tdp = await turmasModel.buscarTdp(idTdp);
      if (!tdp || tdp.id_turma !== idTurma) {
        throw new AppError("Disciplina não encontrada nesta turma", 404);
      }
      await turmasModel.removerTdp(idTdp);
    },
  };
}
