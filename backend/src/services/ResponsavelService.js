import Responsavel from '../models/Responsavel.js';
import * as ResponsavelModel from '../models/ResponsavelModel.js';

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
  const { responsaveis, total } = await ResponsavelModel.listar({ limite: limiteNum, offset });

  return {
    responsaveis,
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
  const responsavel = await ResponsavelModel.buscarPorId(id);
  if (!responsavel) {
    throw new Error(`Responsável ${id} não encontrado.`);
  }
  return responsavel;
}

export async function criar(dados) {
  const responsavelDominio = new Responsavel({ id: 1, ...dados });
  return await ResponsavelModel.criar(responsavelDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const responsavelDominio = new Responsavel({ id, ...dados });
  const atualizou = await ResponsavelModel.atualizar(id, responsavelDominio);
  if (!atualizou) {
    throw new Error(`Responsável ${id} não encontrado.`);
  }
  return await ResponsavelModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await ResponsavelModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Responsável ${id} não encontrado.`);
  }
  return await ResponsavelModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await ResponsavelModel.excluir(id);
  if (!removeu) {
    throw new Error(`Responsável ${id} não encontrado.`);
  }
}
