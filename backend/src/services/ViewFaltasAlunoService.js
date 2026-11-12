// =====================================================================
// services/ViewFaltasAlunoService.js - regras do resumo de faltas (consulta)
// =====================================================================

import * as AlunoModel from '../models/AlunoModel.js';
import * as ViewFaltasAlunoModel from '../models/ViewFaltasAlunoModel.js';
import { AppError } from '../utils/AppError.js';
import { lerPaginacao, montarPaginacao, paraId } from '../utils/validacoes.js';

export async function listar(query) {
  const paginacao = lerPaginacao(query);
  const { faltas, total } = await ViewFaltasAlunoModel.listar(paginacao);
  return { dados: faltas, paginacao: montarPaginacao(paginacao, total) };
}

export async function buscarPorAluno(idRecebido) {
  const id = paraId(idRecebido, 'id_aluno');

  const aluno = await AlunoModel.buscarPorId(id);
  if (!aluno) throw new AppError(`Aluno ${id} não encontrado.`, 404);

  const resumo = await ViewFaltasAlunoModel.buscarPorAluno(id);

  // Aluno sem nenhuma chamada registrada não aparece na view:
  // devolvemos zerado em vez de dar erro.
  return resumo ?? {
    id_aluno: aluno.id_aluno,
    aluno: aluno.nome,
    total_aulas: 0,
    faltas: 0,
    percentual_presenca: null,
  };
}