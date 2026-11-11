// =====================================================================
// services/AuthService.js - REGRAS do login
//
// CAMADA SERVICE: aqui moram as decisões ("a senha confere?", "o perfil
// bate?"). Não conhece req/res (isso é do controller) e não escreve SQL
// (isso é do model).
//
// Este arquivo substitui o antigo UsuarioService: o que o sistema faz
// com "usuarios" é autenticar. Criar/apagar usuário acontece junto com
// o aluno ou professor (ver AlunoService/ProfessorService).
// =====================================================================

import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash, senhaConfere } from '../utils/senha.js';
import { gerarToken } from '../utils/token.js';

const PERFIS_VALIDOS = ['aluno', 'professor', 'admin'];

// Hash "de mentira", calculado uma vez quando o servidor sobe.
// Faz o login gastar o MESMO tempo quando o e-mail não existe. Sem isso,
// resposta rápida = "e-mail não existe" e resposta lenta = "existe, mas a
// senha está errada", e um atacante descobriria quais contas existem.
const HASH_FALSO = await gerarHash('senha-que-ninguem-usa');

// O que o front pode ver do usuário (NUNCA o senha_hash).
function dadosPublicos(usuario) {
  return {
    id_usuario: usuario.id_usuario,
    id_aluno: usuario.id_aluno ?? null,
    id_professor: usuario.id_professor ?? null,
    id_admin: usuario.id_admin ?? null,
    nome: usuario.nome || usuario.email.split('@')[0],
    email: usuario.email,
    perfil: usuario.perfil,
    turma: usuario.turma || usuario.serie || null,
    turno: usuario.turno || usuario.periodo || null,
  };
}

// "= {}": no Express 5, requisição SEM corpo deixa req.body undefined.
export async function login({ login, senha, perfil, lembrar } = {}) {
  // 1) O body pode vir com qualquer coisa: valida antes de usar.
  if (typeof login !== 'string' || typeof senha !== 'string' || login.trim() === '' || senha === '') {
    throw new AppError('Informe seu e-mail ou RA e a senha.', 400);
  }
  if (!PERFIS_VALIDOS.includes(perfil)) {
    throw new AppError('Perfil inválido.', 400);
  }

  // 2) Procura por e-mail ou matrícula (RA).
  const usuario = await UsuarioModel.buscarParaLogin(login.trim());

  // 3) Compara a senha digitada com o HASH salvo no banco.
  const confere = await senhaConfere(senha, usuario?.senha_hash ?? HASH_FALSO);

  // 4) UMA mensagem para qualquer falha (usuário inexistente, senha errada
  //    ou aba errada). Quem manda é o perfil do BANCO: um aluno que marcar
  //    "Administração" na tela é barrado aqui.
  if (!usuario || !confere || usuario.perfil !== perfil) {
    throw new AppError('E-mail/RA, senha ou perfil incorretos.', 401);
  }

  // 5) Gera o "crachá" (mesma função usada pelo generateInitialToken).
  const token = gerarToken(usuario, { lembrar: Boolean(lembrar) });

  return { token, usuario: dadosPublicos(usuario) };
}

// Quem é o dono do token? (o front usa para mostrar nome/perfil)
export async function me(idUsuario) {
  const usuario = await UsuarioModel.buscarPorId(idUsuario);
  // Token válido, mas a conta foi apagada depois: tratamos como não logado.
  if (!usuario) throw new AppError('Usuário não encontrado.', 401);
  return dadosPublicos(usuario);
}
