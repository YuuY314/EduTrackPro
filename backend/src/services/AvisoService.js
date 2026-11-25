import Aviso from '../models/Aviso.js';
import * as AvisoModel from '../models/AvisoModel.js';
import { AppError } from '../utils/AppError.js';

function validarId(idRecebido) {
  const id = Number(idRecebido);
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError('ID deve ser um número inteiro positivo.');
  }
  return id;
}

export async function listar({ pagina = 1, limite = 10 } = {}, { idTurma = null } = {}) {
  const paginaNum = Number(pagina);
  const limiteNum = Number(limite);

  if (!Number.isInteger(paginaNum) || paginaNum <= 0) {
    throw new TypeError('Página deve ser um número inteiro positivo.');
  }
  if (!Number.isInteger(limiteNum) || limiteNum < 1 || limiteNum > 100) {
    throw new TypeError('Limite deve ser um inteiro entre 1 e 100.');
  }

  const offset = (paginaNum - 1) * limiteNum;
  const { avisos, total } = await AvisoModel.listar({ limite: limiteNum, offset, id_turma: idTurma });

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
  const avisoDominio = new Aviso({ ...dados, id_aviso: 1 }); // id provisório só para validar; o banco gera o real
  return await AvisoModel.criar(avisoDominio);
}

// Mantém autor, data de publicação e campos não enviados. Antes o PUT exigia
// "id_autor" no corpo (qualquer um podia "assinar" pelo outro) e trocava a data
// de publicação para hoje a cada edição. Professor só edita os próprios avisos.
export async function atualizar(idRecebido, dados = {}, usuario) {
  const id = validarId(idRecebido);
  const existente = await buscarPorId(id);

  if (usuario?.perfil === 'professor' && Number(existente.id_autor) !== Number(usuario.sub)) {
    throw new AppError('Você só pode editar os avisos que você publicou.', 403);
  }

  const avisoDominio = new Aviso({
    id_turma: existente.id_turma,
    titulo: existente.titulo,
    texto: existente.texto,
    ...dados,
    id_aviso: id,
    id_autor: Number(existente.id_autor),
    data_publicacao: dados.data_publicacao ?? '2000-01-01', // só para validar; trocada abaixo
  });
  if (dados.data_publicacao === undefined) avisoDominio.data_publicacao = existente.data_publicacao;

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
