// =====================================================================
// services/Administrador.js - regras do cadastro de administradores
//
// Mesmo raciocínio do AlunoService: administrador + login em transação.
// =====================================================================

import { emTransacao } from '../config/database.js';
import * as AdministradorModel from '../models/AdministradorModel.js';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash } from '../utils/senha.js';
import { lerPaginacao, lerTextos, montarPaginacao, paraId, validarSenha } from '../utils/validacoes.js';

const TEXTOS = ['nome', 'cpf', 'email'];

export async function listar(query) {
  const paginacao = lerPaginacao(query);
  const { administradores, total } = await AdministradorModel.listar(paginacao);
  return { dados: administradores, paginacao: montarPaginacao(paginacao, total) };
}

export async function buscarPorId(idRecebido) {
  const id = paraId(idRecebido);
  const administrador = await AdministradorModel.buscarPorId(id);
  if (!administrador) throw new AppError(`Administrador ${id} não encontrado.`, 404);
  return administrador;
}

// body: { nome, cpf, email, senha, telefone? }
export async function criar(body = {}) {
  const dados = lerTextos(body, { obrigatorios: [...TEXTOS, 'senha'], opcionais: ['telefone'] });
  const senha_hash = await gerarHash(validarSenha(dados.senha));

  const id = await emTransacao(async (conexao) => {
    // o ENUM do banco é 'admin' (não 'administrador')
    const id_usuario = await UsuarioModel.criar({ email: dados.email, senha_hash, perfil: 'admin' }, conexao);
    return AdministradorModel.criar({ ...dados, id_usuario }, conexao);
  });

  return AdministradorModel.buscarPorId(id);
}

export async function atualizar(idRecebido, body = {}) {
  const atual = await buscarPorId(idRecebido);
  const campos = lerTextos(body, { opcionais: [...TEXTOS, 'telefone'] });

  await emTransacao(async (conexao) => {
    await AdministradorModel.atualizar(atual.id_admin, campos, conexao);
    if (campos.email) await UsuarioModel.atualizarEmail(atual.id_usuario, campos.email, conexao);
  });

  return AdministradorModel.buscarPorId(atual.id_admin);
}

export async function excluir(idRecebido) {
  const administrador = await buscarPorId(idRecebido);
  await emTransacao(async (conexao) => {
    await AdministradorModel.excluir(administrador.id_admin, conexao);
    await UsuarioModel.excluir(administrador.id_usuario, conexao);
  });
}
