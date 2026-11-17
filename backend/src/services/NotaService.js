import Nota from '../models/Nota.js';
import * as NotaModel from '../models/NotaModel.js';

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
  const { notas, total } = await NotaModel.listar({ limite: limiteNum, offset });

  return {
    notas,
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
  const nota = await NotaModel.buscarPorId(id);
  if (!nota) {
    throw new Error(`Nota ${id} não encontrado.`);
  }
  return nota;
}

export async function criar(dados) {
  const notaDominio = new Nota({ id: 1, ...dados });
  return await NotaModel.criar(notaDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const notaDominio = new Nota({ id, ...dados });
  const atualizou = await NotaModel.atualizar(id, notaDominio);
  if (!atualizou) {
    throw new Error(`Nota ${id} não encontrado.`);
  }
  return await NotaModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await NotaModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Nota ${id} não encontrado.`);
  }
  return await NotaModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await NotaModel.excluir(id);
  if (!removeu) {
    throw new Error(`Nota ${id} não encontrado.`);
  }
}

export async function buscarBoletim(id_tdp, bimestre) {
  const idTdpNum = validarId(id_tdp);
  const bimNum = Number(bimestre);
  if (!Number.isInteger(bimNum) || bimNum < 1 || bimNum > 4) {
    throw new TypeError('Bimestre deve ser um inteiro entre 1 e 4.');
  }
  return await NotaModel.buscarBoletim(idTdpNum, bimNum);
}

export async function salvarBoletim(dados) {
  const id_tdp = validarId(dados?.id_tdp);
  const bimestre = Number(dados?.bimestre);
  const titulos = dados?.titulos;
  const registros = dados?.registros;

  if (!Number.isInteger(bimestre) || bimestre < 1 || bimestre > 4) {
    throw new TypeError('Bimestre deve ser um inteiro entre 1 e 4.');
  }
  if (!Array.isArray(titulos) || titulos.length === 0) {
    throw new TypeError('Informe os títulos das avaliações.');
  }
  if (!Array.isArray(registros) || registros.length === 0) {
    throw new TypeError('Informe a lista de alunos.');
  }

  for (const reg of registros) {
    validarId(reg.id_aluno);
    for (const n of reg.notas) {
      if (n !== '' && n !== null && n !== undefined) {
        const val = Number(n);
        if (!Number.isFinite(val) || val < 0 || val > 10) {
          throw new TypeError('Todas as notas devem estar entre 0 e 10.');
        }
      }
    }
  }

  return await NotaModel.salvarBoletimCompleto({ id_tdp, bimestre, titulos, registros });
}

