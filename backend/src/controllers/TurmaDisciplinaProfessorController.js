import * as TurmaDisciplinaProfessorService from '../services/TurmaDisciplinaProfessorService.js';

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
    const resultado = await TurmaDisciplinaProfessorService
  .listar(req.query);
    return res.status(200).json({
      sucesso: true,
      dados: resultado.turma_disciplina_professor,
      paginacao: resultado.paginacao
    });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const turma_disciplina_professor = await TurmaDisciplinaProfessorService
  .buscarPorId(req.params.id);
    return res.status(200).json({ sucesso: true, dados: turma_disciplina_professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function criar(req, res, next) {
  try {
    const turma_disciplina_professor = await TurmaDisciplinaProfessorService
  .criar(req.body);
    return res.status(201).json({ sucesso: true, dados: turma_disciplina_professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function atualizar(req, res, next) {
  try {
    const turma_disciplina_professor = await TurmaDisciplinaProfessorService
  .atualizar(req.params.id, req.body);
    return res.status(200).json({ sucesso: true, dados: turma_disciplina_professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function enviarImagem(req, res, next) {
  try {
    const imagemUrl = `/uploads/turma_disciplina_professor/${req.file.filename}`;
    const turma_disciplina_professor = await TurmaDisciplinaProfessorService
  .salvarImagem(req.params.id, imagemUrl);
    return res.status(200).json({ sucesso: true, dados: turma_disciplina_professor });
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}

export async function excluir(req, res, next) {
  try {
    await TurmaDisciplinaProfessorService
  .excluir(req.params.id);
    return res.status(204).send();
  } catch (erro) {
    return responderErro(erro, res, next);
  }
}
