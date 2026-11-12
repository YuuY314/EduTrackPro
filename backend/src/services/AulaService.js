import Aula from '../models/Aula.js';
import * as AulaModel from '../models/AulaModel.js';

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
  const { aulas, total } = await AulaModel.listar({ limite: limiteNum, offset });

  return {
    aulas,
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
  const aula = await AulaModel.buscarPorId(id);
  if (!aula) {
    throw new Error(`Aula ${id} não encontrado.`);
  }
  return aula;
}

export async function criar(dados) {
  const aulaDominio = new Aula({ id: 1, ...dados });
  return await AulaModel.criar(aulaDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const aulaDominio = new Aula({ id, ...dados });
  const atualizou = await AulaModel.atualizar(id, aulaDominio);
  if (!atualizou) {
    throw new Error(`Aula ${id} não encontrado.`);
  }
  return await AulaModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await AulaModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Aula ${id} não encontrado.`);
  }
  return await AulaModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await AulaModel.excluir(id);
  if (!removeu) {
    throw new Error(`Aula ${id} não encontrado.`);
  }
}
