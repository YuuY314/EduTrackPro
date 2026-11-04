import * as ProfessorService from '../services/ProfessorService.js';

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
    const resultado = await ProfessorService
  .listar(req.query);
    return res.status(200).json({
      sucesso: true,
      dados: resultado.professors,
      paginacao: resultado.paginacao
    });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const professor = await ProfessorService
  .buscarPorId(req.params.id);
    return res.status(200).json({ sucesso: true, dados: professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function criar(req, res, next) {
  try {
    const professor = await ProfessorService
  .criar(req.body);
    return res.status(201).json({ sucesso: true, dados: professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function atualizar(req, res, next) {
  try {
    const professor = await ProfessorService
  .atualizar(req.params.id, req.body);
    return res.status(200).json({ sucesso: true, dados: professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function enviarImagem(req, res, next) {
  try {
    const imagemUrl = `/uploads/professores/${req.file.filename}`;
    const professor = await ProfessorService
  .salvarImagem(req.params.id, imagemUrl);
    return res.status(200).json({ sucesso: true, dados: professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function excluir(req, res, next) {
  try {
    await ProfessorService
  .excluir(req.params.id);
    return res.status(204).send();
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}
