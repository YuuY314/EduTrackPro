import Aluno from '../models/Aluno.js';
import * as AlunoModel from '../models/AlunoModel.js';

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
  const { alunos, total } = await AlunoModel.listar({ limite: limiteNum, offset });

  return {
    alunos,
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
  const aluno = await AlunoModel.buscarPorId(id);
  if (!aluno) {
    throw new Error(`Aluno ${id} não encontrado.`);
  }
  return aluno;
}

export async function criar(dados) {
  const alunoDominio = new Aluno({ id: 1, ...dados });
  return await AlunoModel.criar(alunoDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const alunoDominio = new Aluno({ id, ...dados });
  const atualizou = await AlunoModel.atualizar(id, alunoDominio);
  if (!atualizou) {
    throw new Error(`Aluno ${id} não encontrado.`);
  }
  return await AlunoModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await AlunoModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Aluno ${id} não encontrado.`);
  }
  return await AlunoModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await AlunoModel.excluir(id);
  if (!removeu) {
    throw new Error(`Aluno ${id} não encontrado.`);
  }
}
