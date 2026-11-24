import * as NotaService from '../services/NotaService.js';
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
    const resultado = await NotaService
  .listar(req.query);
    return res.status(200).json({
      sucesso: true,
      dados: resultado.notas,
      paginacao: resultado.paginacao
    });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const nota = await NotaService
  .buscarPorId(req.params.id);
    return res.status(200).json({ sucesso: true, dados: nota });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function criar(req, res, next) {
  try {
    const nota = await NotaService
  .criar(req.body);
    return res.status(201).json({ sucesso: true, dados: nota });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function atualizar(req, res, next) {
  try {
    const nota = await NotaService
  .atualizar(req.params.id, req.body);
    return res.status(200).json({ sucesso: true, dados: nota });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function enviarImagem(req, res, next) {
  try {
    const imagemUrl = `/uploads/notas/${req.file.filename}`;
    const nota = await NotaService
  .salvarImagem(req.params.id, imagemUrl);
    return res.status(200).json({ sucesso: true, dados: nota });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function excluir(req, res, next) {
  try {
    await NotaService
  .excluir(req.params.id);
    return res.status(204).send();
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarBoletim(req, res, next) {
  try {
    await garantirAcessoTdp(req.usuario, req.query.id_tdp);
    const dados = await NotaService.buscarBoletim(req.query.id_tdp, req.query.bimestre);
    return res.status(200).json({ sucesso: true, dados });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function salvarBoletim(req, res, next) {
  try {
    await garantirAcessoTdp(req.usuario, req.body?.id_tdp);
    const resultado = await NotaService.salvarBoletim(req.body);
    return res.status(200).json({ sucesso: true, dados: resultado });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}