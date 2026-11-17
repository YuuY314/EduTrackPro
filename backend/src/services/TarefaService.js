import Tarefa from '../models/Tarefa.js';
import * as TarefaModel from '../models/TarefaModel.js';

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
  const { tarefas, total } = await TarefaModel.listar({ limite: limiteNum, offset });

  return {
    tarefas,
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
  const tarefa = await TarefaModel.buscarPorId(id);
  if (!tarefa) {
    throw new Error(`Tarefa ${id} não encontrado.`);
  }
  return tarefa;
}

export async function criar(dados) {
  const tarefaDominio = new Tarefa({ id: 1, ...dados });
  return await TarefaModel.criar(tarefaDominio);
}

export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const tarefaDominio = new Tarefa({ id, ...dados });
  const atualizou = await TarefaModel.atualizar(id, tarefaDominio);
  if (!atualizou) {
    throw new Error(`Tarefa ${id} não encontrado.`);
  }
  return await TarefaModel.buscarPorId(id);
}

export async function salvarImagem(idRecebido, imagemUrl) {
  const id = validarId(idRecebido);
  const atualizou = await TarefaModel.atualizarImagem(id, imagemUrl);
  if (!atualizou) {
    throw new Error(`Tarefa ${id} não encontrado.`);
  }
  return await TarefaModel.buscarPorId(id);
}

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await TarefaModel.excluir(id);
  if (!removeu) {
    throw new Error(`Tarefa ${id} não encontrado.`);
  }
}
