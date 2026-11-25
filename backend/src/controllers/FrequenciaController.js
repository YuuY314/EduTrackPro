import * as FrequenciaService from '../services/FrequenciaService.js';
import { garantirAcessoTdp } from '../utils/permissoes.js';

function responderErro(erro, res, next) {
  if (erro instanceof TypeError) {
    return res.status(400).json({ sucesso: false, erro: erro.message });
  }
  if (erro.message.includes('não encontrado')) {
    return res.status(404).json({ sucesso: false, erro: erro.message });
  }
  return next(erro);
}

export async function listar(req, res, next) {
  try {
    const resultado = await FrequenciaService
  .listar(req.query);
    return res.status(200).json({
      sucesso: true,
      dados: resultado.frequencias,
      paginacao: resultado.paginacao
    });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const frequencia = await FrequenciaService
  .buscarPorId(req.params.id);
    return res.status(200).json({ sucesso: true, dados: frequencia });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function criar(req, res, next) {
  try {
    const frequencia = await FrequenciaService
  .criar(req.body);
    return res.status(201).json({ sucesso: true, dados: frequencia });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function atualizar(req, res, next) {
  try {
    const frequencia = await FrequenciaService
  .atualizar(req.params.id, req.body);
    return res.status(200).json({ sucesso: true, dados: frequencia });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function enviarImagem(req, res, next) {
  try {
    const imagemUrl = `/uploads/frequencias/${req.file.filename}`;
    const frequencia = await FrequenciaService
  .salvarImagem(req.params.id, imagemUrl);
    return res.status(200).json({ sucesso: true, dados: frequencia });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function excluir(req, res, next) {
  try {
    await FrequenciaService
  .excluir(req.params.id);
    return res.status(204).send();
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarChamada(req, res, next) {
  try {
    const { id_tdp, data, id_horario } = req.query;
    await garantirAcessoTdp(req.usuario, id_tdp);
    const resultado = await FrequenciaService.buscarChamada(id_tdp, data, id_horario);
    return res.status(200).json({ sucesso: true, dados: resultado });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function salvarChamada(req, res, next) {
  try {
    await garantirAcessoTdp(req.usuario, req.body?.id_tdp);
    const resultado = await FrequenciaService.salvarChamada(req.body);
    return res.status(200).json({ sucesso: true, dados: resultado });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function listarHorarios(req, res, next) {
  try {
    await garantirAcessoTdp(req.usuario, req.params.id_tdp);
    const horarios = await FrequenciaService.listarHorarios(req.params.id_tdp);
    return res.status(200).json({ sucesso: true, dados: horarios });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}