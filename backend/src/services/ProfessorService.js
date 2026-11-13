// =====================================================================
// services/ProfessorService.js - regras do cadastro de professores
//
// Mesmo raciocínio do AlunoService: professor + login em transação.
// =====================================================================

import { emTransacao } from '../config/database.js';
import * as ProfessorModel from '../models/ProfessorModel.js';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash } from '../utils/senha.js';
import { lerPaginacao, lerTextos, montarPaginacao, paraId } from '../utils/validacoes.js';

const TEXTOS = ['nome', 'cpf', 'email'];

export async function listar(query) {
  const paginacao = lerPaginacao(query);
  const { professores, total } = await ProfessorModel.listar(paginacao);
  return { dados: professores, paginacao: montarPaginacao(paginacao, total) };
}

export async function buscarPorId(idRecebido) {
  const id = paraId(idRecebido);
  const professor = await ProfessorModel.buscarPorId(id);
  if (!professor) throw new AppError(`Professor ${id} não encontrado.`, 404);
  return professor;
}

// body: { nome, cpf, email, senha, telefone? }
export async function criar(body = {}) {
  const dados = lerTextos(body, { obrigatorios: [...TEXTOS, 'senha'], opcionais: ['telefone'] });
  const senha_hash = await gerarHash(dados.senha);

  const id = await emTransacao(async (conexao) => {
    const id_usuario = await UsuarioModel.criar({ email: dados.email, senha_hash, perfil: 'professor' }, conexao);
    return ProfessorModel.criar({ ...dados, id_usuario }, conexao);
  });

  return ProfessorModel.buscarPorId(id);
}

export async function atualizar(idRecebido, body = {}) {
  const atual = await buscarPorId(idRecebido);
  const campos = lerTextos(body, { opcionais: [...TEXTOS, 'telefone'] });

  await emTransacao(async (conexao) => {
    await ProfessorModel.atualizar(atual.id_professor, campos, conexao);
    if (campos.email) await UsuarioModel.atualizarEmail(atual.id_usuario, campos.email, conexao);
  });

  return ProfessorModel.buscarPorId(atual.id_professor);
}

// Se o professor ainda dá aula em alguma turma, o MySQL recusa
// (FK em turma_disciplina_professor) e o errorHandler responde 409.
export async function excluir(idRecebido) {
  const professor = await buscarPorId(idRecebido);
  await emTransacao(async (conexao) => {
    await ProfessorModel.excluir(professor.id_professor, conexao);
    await UsuarioModel.excluir(professor.id_usuario, conexao);
  });
}
