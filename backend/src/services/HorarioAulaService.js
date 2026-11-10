import HorarioAula from '../models/HorarioAula.js';
import * as HorarioAulaModel from '../models/HorarioAulaModel.js';

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
  const { horarios_aula, total } = await HorarioAulaModel.listar({ limite: limiteNum, offset });

  return {
    horarios_aula,
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
  const horario_aula = await HorarioAulaModel.buscarPorId(id);
  if (!horario_aula) {
    throw new Error(`HorarioAula ${id} não encontrado.`);
  }
  return horario_aula;
}

export async function criar(dados) {
  const horario_aulaDominio = new HorarioAula({ id: 1, ...dados });
  return await HorarioAulaModel.criar(horario_aulaDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const horario_aulaDominio = new HorarioAula({ id, ...dados });
  const atualizou = await HorarioAulaModel.atualizar(id, horario_aulaDominio);
  if (!atualizou) {
    throw new Error(`HorarioAula ${id} não encontrado.`);
  }
  return await HorarioAulaModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await HorarioAulaModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`HorarioAula ${id} não encontrado.`);
  }
  return await HorarioAulaModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await HorarioAulaModel.excluir(id);
  if (!removeu) {
    throw new Error(`HorarioAula ${id} não encontrado.`);
  }
}
