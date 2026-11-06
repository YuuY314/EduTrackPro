import TurmaDisciplinaProfessor from '../models/TurmaDisciplinaProfessor.js';
import * as TurmaDisciplinaProfessorModel from '../models/TurmaDisciplinaProfessorModel.js';

function validarId(idRecebido) {
  const id = Number(idRecebido);
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError('ID deve ser um número inteiro positivo.');
  }
  return id;
}

export async function listar({ pagina = 1, limite = 10 } = {}) {
  const paginaNum = Number(pagina);
  const limiteNum = Number(limite);

  if (!Number.isInteger(paginaNum) || paginaNum <= 0) {
    throw new TypeError('Página deve ser um número inteiro positivo.');
  }
  if (!Number.isInteger(limiteNum) || limiteNum < 1 || limiteNum > 100) {
    throw new TypeError('Limite deve ser um inteiro entre 1 e 100.');
  }

  const offset = (paginaNum - 1) * limiteNum;
  const { turma_disciplina_professor, total } = await TurmaDisciplinaProfessorModel.listar({ limite: limiteNum, offset });

  return {
    turma_disciplina_professor,
    paginacao: {
      pagina: paginaNum,
      limite: limiteNum,
      total,
      totalPaginas: Math.ceil(total / limiteNum)
    }
  };
}

export async function buscarPorId(idRecebido) {
  const id = validarId(idRecebido);
  const turma_disciplina_professor = await TurmaDisciplinaProfessorModel.buscarPorId(id);
  if (!turma_disciplina_professor) {
    throw new Error(`TurmaDisciplinaProfessor ${id} não encontrado.`);
  }
  return turma_disciplina_professor;
}

export async function criar(dados) {
  const turma_disciplina_professorDominio = new TurmaDisciplinaProfessor({ id: 1, ...dados });
  return await TurmaDisciplinaProfessorModel.criar(turma_disciplina_professorDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const turma_disciplina_professorDominio = new TurmaDisciplinaProfessor({ id, ...dados });
  const atualizou = await TurmaDisciplinaProfessorModel.atualizar(id, turma_disciplina_professorDominio);
  if (!atualizou) {
    throw new Error(`TurmaDisciplinaProfessor ${id} não encontrado.`);
  }
  return await TurmaDisciplinaProfessorModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await TurmaDisciplinaProfessorModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`TurmaDisciplinaProfessor ${id} não encontrado.`);
  }
  return await TurmaDisciplinaProfessorModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await TurmaDisciplinaProfessorModel.excluir(id);
  if (!removeu) {
    throw new Error(`TurmaDisciplinaProfessor ${id} não encontrado.`);
  }
}
