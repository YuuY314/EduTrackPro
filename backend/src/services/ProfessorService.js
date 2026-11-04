import professor from '../models/Professores.js';
import * as ProfessorModel from '../models/ProfessorModel.js';

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
  const { professores, total } = await ProfessorModel.listar({ limite: limiteNum, offset });

  return {
    professores,
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
  const professor = await ProfessorModel.buscarPorId(id);
  if (!professor) {
    throw new Error(`Professor ${id} não encontrado.`);
  }
  return professor;
}

export async function criar(dados) {
  const professorDominio = new professor({ id: 1, ...dados });
  return await ProfessorModel.criar(professorDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const professorDominio = new professor({ id, ...dados });
  const atualizou = await ProfessorModel.atualizar(id, professorDominio);
  if (!atualizou) {
    throw new Error(`Professor ${id} não encontrado.`);
  }
  return await ProfessorModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await ProfessorModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Professor ${id} não encontrado.`);
  }
  return await ProfessorModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await ProfessorModel.excluir(id);
  if (!removeu) {
    throw new Error(`Professor ${id} não encontrado.`);
  }
}
