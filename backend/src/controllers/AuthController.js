// =====================================================================
// controllers/AuthController.js - lê req, chama o service, devolve res
// Sem try/catch: no Express 5 o erro vai sozinho para o errorHandler.
// =====================================================================

import * as AuthService from '../services/AuthService.js';

// POST /api/auth/login  { login, senha, perfil, lembrar? }
export async function login(req, res) {
  res.json(await AuthService.login(req.body));
}

// GET /api/auth/me  (precisa do token)
export async function me(req, res) {
  res.json(await AuthService.me(req.usuario.sub));
}

// POST /api/auth/google { credential, perfil }
export async function loginGoogle(req, res) {
  const { credential, perfil } = req.body ?? {};
  res.json(await AuthService.loginGoogle(credential, perfil));
}
