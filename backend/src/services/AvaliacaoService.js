import Avaliacao from '../models/Avaliacao.js';
import * as AvaliacaoModel from '../models/AvaliacaoModel.js';

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
  const { avaliacoes, total } = await AvaliacaoModel.listar({ limite: limiteNum, offset });

  return {
    avaliacoes,
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
  const avaliacao = await AvaliacaoModel.buscarPorId(id);
  if (!avaliacao) {
    throw new Error(`Avaliacao ${id} não encontrado.`);
  }
  return avaliacao;
}

export async function criar(dados) {
  const avaliacaoDominio = new Avaliacao({ id: 1, ...dados });
  return await AvaliacaoModel.criar(avaliacaoDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const avaliacaoDominio = new Avaliacao({ id, ...dados });
  const atualizou = await AvaliacaoModel.atualizar(id, avaliacaoDominio);
  if (!atualizou) {
    throw new Error(`Avaliacao ${id} não encontrado.`);
  }
  return await AvaliacaoModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await AvaliacaoModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Avaliacao ${id} não encontrado.`);
  }
  return await AvaliacaoModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await AvaliacaoModel.excluir(id);
  if (!removeu) {
    throw new Error(`Avaliacao ${id} não encontrado.`);
  }
}
