// =====================================================================
// services/ViewBoletimService.js - regras do boletim (somente consulta)
//
// Valida o id, confere se o aluno existe e organiza os dados no formato
// que a tela quer: 1 linha por disciplina com as 4 notas de bimestre.
// =====================================================================

import * as AlunoModel from '../models/AlunoModel.js';
import * as ViewBoletimModel from '../models/ViewBoletimModel.js';
import { AppError } from '../utils/AppError.js';
import { lerPaginacao, montarPaginacao, paraId } from '../utils/validacoes.js';

export async function listar(query) {
  const paginacao = lerPaginacao(query);
  const { boletim, total } = await ViewBoletimModel.listar(paginacao);
  return { dados: boletim, paginacao: montarPaginacao(paginacao, total) };
}

export async function buscarPorAluno(idRecebido) {
  const id = paraId(idRecebido, 'id_aluno');

  const aluno = await AlunoModel.buscarPorId(id);
  if (!aluno) throw new AppError(`Aluno ${id} não encontrado.`, 404);

  const linhas = await ViewBoletimModel.buscarPorAluno(id);

  // A view devolve 1 linha por (disciplina, bimestre). Aqui viramos
  // 1 linha por disciplina: { disciplina, notas: [b1, b2, b3, b4] },
  // com null no bimestre que ainda não tem nota.
  const porDisciplina = new Map();
  for (const linha of linhas) {
    if (!porDisciplina.has(linha.disciplina)) {
      porDisciplina.set(linha.disciplina, {
        disciplina: linha.disciplina,
        notas: [null, null, null, null],
      });
    }
    porDisciplina.get(linha.disciplina).notas[linha.bimestre - 1] = linha.media;
  }

  return {
    aluno: { id_aluno: aluno.id_aluno, nome: aluno.nome, turma: aluno.turma },
    disciplinas: [...porDisciplina.values()],
  };
}