import Frequencia from '../models/Frequencia.js';
import * as FrequenciaModel from '../models/FrequenciaModel.js';

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
  const { frequencias, total } = await FrequenciaModel.listar({ limite: limiteNum, offset });

  return {
    frequencias,
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
  const frequencia = await FrequenciaModel.buscarPorId(id);
  if (!frequencia) {
    throw new Error(`Frequência ${id} não encontrado.`);
  }
  return frequencia;
}

export async function criar(dados) {
  const frequenciaDominio = new Frequencia({ id: 1, ...dados });
  return await FrequenciaModel.criar(frequenciaDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const frequenciaDominio = new Frequencia({ id, ...dados });
  const atualizou = await FrequenciaModel.atualizar(id, frequenciaDominio);
  if (!atualizou) {
    throw new Error(`Frequência ${id} não encontrado.`);
  }
  return await FrequenciaModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await FrequenciaModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Frequência ${id} não encontrado.`);
  }
  return await FrequenciaModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await FrequenciaModel.excluir(id);
  if (!removeu) {
    throw new Error(`Frequência ${id} não encontrado.`);
  }
}
