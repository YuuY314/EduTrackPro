import * as AvisoService from '../services/AvisoService.js';
import { turmaDoAluno } from '../utils/permissoes.js';

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
    // aluno só vê o que é da turma dele; equipe vê tudo
    const idTurma = await turmaDoAluno(req.usuario);
    const resultado = await AvisoService.listar(req.query, { idTurma });
    return res.status(200).json({
      sucesso: true,
      dados: resultado.avisos,
      paginacao: resultado.paginacao
    });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const aviso = await AvisoService
  .buscarPorId(req.params.id);
    return res.status(200).json({ sucesso: true, dados: aviso });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function criar(req, res, next) {
  try {
    // o autor é quem está logado (token), não o que vier no corpo
    const aviso = await AvisoService.criar({ ...req.body, id_autor: req.usuario.sub });
    return res.status(201).json({ sucesso: true, dados: aviso });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function atualizar(req, res, next) {
  try {
    const aviso = await AvisoService
  .atualizar(req.params.id, req.body);
    return res.status(200).json({ sucesso: true, dados: aviso });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function enviarImagem(req, res, next) {
  try {
    const imagemUrl = `/uploads/avisos/${req.file.filename}`;
    const aviso = await AvisoService
  .salvarImagem(req.params.id, imagemUrl);
    return res.status(200).json({ sucesso: true, dados: aviso });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function excluir(req, res, next) {
  try {
    await AvisoService
  .excluir(req.params.id);
    return res.status(204).send();
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}
