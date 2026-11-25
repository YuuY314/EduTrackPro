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

// id_horario é opcional: vazio/ausente = qualquer aula do dia (comportamento antigo)
function lerIdHorario(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  return validarId(valor);
}

export async function buscarChamada(id_tdp, data, id_horario) {
  const idTdpNum = validarId(id_tdp);
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new TypeError('Data deve estar no formato YYYY-MM-DD.');
  }
  return await FrequenciaModel.buscarChamada(idTdpNum, data, lerIdHorario(id_horario));
}

export async function salvarChamada(dados) {
  const id_tdp = validarId(dados?.id_tdp);
  const { data, conteudo, registros } = dados || {};
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new TypeError('Data deve estar no formato YYYY-MM-DD.');
  }
  if (!Array.isArray(registros) || registros.length === 0) {
    throw new TypeError('É necessário informar a lista de frequência dos alunos.');
  }
  for (const reg of registros) validarId(reg?.id_aluno);
  const id_horario = lerIdHorario(dados.id_horario);
  return await FrequenciaModel.salvarChamadaCompleta({ id_tdp, id_horario, data, conteudo, registros });
}

export async function listarHorarios(id_tdp) {
  const idTdpNum = validarId(id_tdp);
  return await FrequenciaModel.listarHorariosPorTdp(idTdpNum);
}
export async function resumoPorTdp(id_tdp) {
  return await FrequenciaModel.resumoPorTdp(validarId(id_tdp));
}
