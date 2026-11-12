// =====================================================================
// services/AlunoService.js - regras do cadastro de alunos (área do admin)
//
// Todo aluno tem um login (linha em "usuarios"). Por isso criar e
// excluir acontecem em TRANSAÇÃO: ou grava os dois, ou nenhum.
// =====================================================================

import { emTransacao } from '../config/database.js';
import * as AlunoModel from '../models/AlunoModel.js';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash } from '../utils/senha.js';
import { lerPaginacao, lerTextos, montarPaginacao, paraId } from '../utils/validacoes.js';

const TEXTOS = ['matricula', 'nome', 'cpf', 'email_institucional'];

export async function listar(query) {
  const paginacao = lerPaginacao(query);
  const { alunos, total } = await AlunoModel.listar(paginacao);
  return { dados: alunos, paginacao: montarPaginacao(paginacao, total) };
}

export async function buscarPorId(idRecebido) {
  const id = paraId(idRecebido);
  const aluno = await AlunoModel.buscarPorId(id);
  if (!aluno) throw new AppError(`Aluno ${id} não encontrado.`, 404);
  return aluno;
}

// body: { matricula, nome, cpf, email_institucional, senha, id_turma, id_responsavel, endereco? }
export async function criar(body = {}) {
  const dados = lerTextos(body, { obrigatorios: [...TEXTOS, 'senha'], opcionais: ['endereco'] });
  dados.id_turma = paraId(body.id_turma, 'id_turma');
  dados.id_responsavel = paraId(body.id_responsavel, 'id_responsavel');
  const senha_hash = await gerarHash(dados.senha);

  const id = await emTransacao(async (conexao) => {
    const id_usuario = await UsuarioModel.criar(
      { email: dados.email_institucional, senha_hash, perfil: 'aluno' }, conexao
    );
    return AlunoModel.criar({ ...dados, id_usuario }, conexao);
  });

  return AlunoModel.buscarPorId(id);
}

// Atualiza só o que vier no body.
export async function atualizar(idRecebido, body = {}) {
  const atual = await buscarPorId(idRecebido);

  const campos = lerTextos(body, { opcionais: [...TEXTOS, 'endereco'] });
  if (body.id_turma !== undefined) campos.id_turma = paraId(body.id_turma, 'id_turma');
  if (body.id_responsavel !== undefined) campos.id_responsavel = paraId(body.id_responsavel, 'id_responsavel');

  await emTransacao(async (conexao) => {
    await AlunoModel.atualizar(atual.id_aluno, campos, conexao);
    // o e-mail institucional é também o e-mail de login
    if (campos.email_institucional) {
      await UsuarioModel.atualizarEmail(atual.id_usuario, campos.email_institucional, conexao);
    }
  });

  return AlunoModel.buscarPorId(atual.id_aluno);
}

export async function excluir(idRecebido) {
  const aluno = await buscarPorId(idRecebido);
  // notas e frequências do aluno saem juntas (ON DELETE CASCADE no SQL)
  await emTransacao(async (conexao) => {
    await AlunoModel.excluir(aluno.id_aluno, conexao);
    await UsuarioModel.excluir(aluno.id_usuario, conexao);
  });
}
