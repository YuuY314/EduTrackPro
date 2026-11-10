import * as FrequenciaService from '../services/FrequenciaService.js';

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
