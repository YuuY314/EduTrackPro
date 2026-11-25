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

import { OAuth2Client } from 'google-auth-library';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash, senhaConfere } from '../utils/senha.js';
import { gerarToken, verificarTokenRecuperacao, gerarTokenRecuperacao, impressaoSenha } from '../utils/token.js';
import { ambiente } from '../config/ambiente.js';

import { enviarEmailRecuperacao } from './GmailAPIService.js';

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

const googleClient = new OAuth2Client();

export async function loginGoogle(idToken, perfil) {
  if (typeof idToken !== 'string' || !idToken.trim()) {
    throw new AppError('Credencial do Google não informada.', 400);
  }
  if (!ambiente.googleClientId) {
    throw new AppError('Login com Google não está configurado no servidor.', 503);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: ambiente.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Não foi possível validar sua conta Google.', 401);
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw new AppError('A conta Google não possui e-mail verificado.', 401);
  }

  // Não criamos contas automaticamente: a escola precisa cadastrar o usuário.
  const usuario = await UsuarioModel.buscarPorEmailGoogle(payload.email);
  if (!usuario) {
    throw new AppError('Não existe uma conta EduTrackPro vinculada a esse e-mail.', 403);
  }
  if (perfil && usuario.perfil !== perfil) {
    throw new AppError('Esta conta não pertence ao perfil selecionado.', 403);
  }

  const token = gerarToken(usuario);
  return { token, usuario: dadosPublicos(usuario) };
}

// =====================================================================
// RECUPERAÇÃO DE SENHA
// =====================================================================

const MENSAGEM_RECUPERACAO =
  'Se existir uma conta vinculada aos dados informados, enviaremos um link de recuperação.';

// POST /api/auth/recuperar-senha { login }
export async function solicitarRecuperacaoSenha({ login } = {}) {
  if (typeof login !== 'string' || !login.trim()) {
    throw new AppError('Informe seu e-mail ou RA.', 400);
  }

  const usuario = await UsuarioModel.buscarParaLogin(login.trim());

  // Não revela se a conta existe.
  if (!usuario) {
    return { mensagem: MENSAGEM_RECUPERACAO };
  }

  const token = gerarTokenRecuperacao(usuario.id_usuario, usuario.senha_hash);

  try {
    await enviarEmailRecuperacao({
      to: usuario.email,
      nome: usuario.nome,
      token,
      validade: '30 minutos',
    });
  } catch (erro) {
    console.error('Erro ao enviar e-mail de recuperação:', erro);
  }

  return { mensagem: MENSAGEM_RECUPERACAO };
}

// POST /api/auth/redefinir-senha { token, senha }
export async function redefinirSenha({ token, senha } = {}) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new AppError('Link de recuperação inválido ou expirado.', 400);
  }

  // mesmo mínimo do cadastro (8)
  if (typeof senha !== 'string' || senha.length < 8) {
    throw new AppError('A senha deve possuir pelo menos 8 caracteres.', 400);
  }

  const payload = verificarTokenRecuperacao(token);

  const usuario = await UsuarioModel.buscarPorId(payload.sub);

  if (!usuario) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  // Link já usado (a senha mudou depois que ele foi gerado) ou gerado antes desta regra
  if (payload.ph !== impressaoSenha(usuario.senha_hash)) {
    throw new AppError('Link de recuperação inválido ou expirado.', 400);
  }

  const senhaHash = await gerarHash(senha);

  await UsuarioModel.atualizarSenha(usuario.id_usuario, senhaHash);

  return {
    mensagem: 'Senha redefinida com sucesso.',
  };
}