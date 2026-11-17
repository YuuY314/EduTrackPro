import Aviso from '../models/Aviso.js';
import * as AvisoModel from '../models/AvisoModel.js';

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
  const { avisos, total } = await AvisoModel.listar({ limite: limiteNum, offset });

  return {
    avisos,
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
  const aviso = await AvisoModel.buscarPorId(id);
  if (!aviso) {
    throw new Error(`Aviso ${id} não encontrado.`);
  }
  return aviso;
}

export async function criar(dados) {
  const avisoDominio = new Aviso({ id: 1, ...dados });
  return await AvisoModel.criar(avisoDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const avisoDominio = new Aviso({ id, ...dados });
  const atualizou = await AvisoModel.atualizar(id, avisoDominio);
  if (!atualizou) {
    throw new Error(`Aviso ${id} não encontrado.`);
  }
  return await AvisoModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await AvisoModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Aviso ${id} não encontrado.`);
  }
  return await AvisoModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await AvisoModel.excluir(id);
  if (!removeu) {
    throw new Error(`Aviso ${id} não encontrado.`);
  }
}
