import Disciplina from '../models/Disciplina.js';
import * as DisciplinaModel from '../models/DisciplinaModel.js';

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
  const { disciplinas, total } = await DisciplinaModel.listar({ limite: limiteNum, offset });

  return {
    disciplinas,
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
  const disciplina = await DisciplinaModel.buscarPorId(id);
  if (!disciplina) {
    throw new Error(`Disciplina ${id} não encontrado.`);
  }
  return disciplina;
}

export async function criar(dados) {
  const disciplinaDominio = new Disciplina({ id: 1, ...dados });
  return await DisciplinaModel.criar(disciplinaDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const disciplinaDominio = new Disciplina({ id, ...dados });
  const atualizou = await DisciplinaModel.atualizar(id, disciplinaDominio);
  if (!atualizou) {
    throw new Error(`Disciplina ${id} não encontrado.`);
  }
  return await DisciplinaModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await DisciplinaModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Disciplina ${id} não encontrado.`);
  }
  return await DisciplinaModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await DisciplinaModel.excluir(id);
  if (!removeu) {
    throw new Error(`Disciplina ${id} não encontrado.`);
  }
}
