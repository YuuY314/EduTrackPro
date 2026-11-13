import Turma from '../models/Turma.js';
import * as TurmaModel from '../models/TurmaModel.js';

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
  const { turmas, total } = await TurmaModel.listar({ limite: limiteNum, offset });

  return {
    turmas,
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
  const turma = await TurmaModel.buscarPorId(id);
  if (!turma) {
    throw new Error(`Turma ${id} não encontrado.`);
  }
  return turma;
}

export async function criar(dados) {
  const turmaDominio = new Turma({ id: 1, ...dados });
  return await TurmaModel.criar(turmaDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const turmaDominio = new Turma({ id, ...dados });
  const atualizou = await TurmaModel.atualizar(id, turmaDominio);
  if (!atualizou) {
    throw new Error(`Turma ${id} não encontrado.`);
  }
  return await TurmaModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await TurmaModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Turma ${id} não encontrado.`);
  }
  return await TurmaModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await TurmaModel.excluir(id);
  if (!removeu) {
    throw new Error(`Turma ${id} não encontrado.`);
  }
}
