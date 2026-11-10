import * as AulaService from '../services/AulaService.js';

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
    const resultado = await AulaService
  .listar(req.query);
    return res.status(200).json({
      sucesso: true,
      dados: resultado.aulas,
      paginacao: resultado.paginacao
    });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const aula = await AulaService
  .buscarPorId(req.params.id);
    return res.status(200).json({ sucesso: true, dados: aula });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function criar(req, res, next) {
  try {
    const aula = await AulaService
  .criar(req.body);
    return res.status(201).json({ sucesso: true, dados: aula });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function atualizar(req, res, next) {
  try {
    const aula = await AulaService
  .atualizar(req.params.id, req.body);
    return res.status(200).json({ sucesso: true, dados: aula });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function enviarImagem(req, res, next) {
  try {
    const imagemUrl = `/uploads/aulas/${req.file.filename}`;
    const aula = await AulaService
  .salvarImagem(req.params.id, imagemUrl);
    return res.status(200).json({ sucesso: true, dados: aula });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function excluir(req, res, next) {
  try {
    await AulaService
  .excluir(req.params.id);
    return res.status(204).send();
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}
