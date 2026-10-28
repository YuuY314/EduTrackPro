// =====================================================================
// routes/auth.routes.js
// CAMADA ROUTES: só liga  MÉTODO + CAMINHO + middlewares -> controller.
// Sem lógica. A ordem dos middlewares importa: eles rodam da esquerda
// para a direita:  autenticar -> exigirPerfil -> validar -> controller
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { validar } from "../middlewares/validacao.js";

// O schema descreve o formato esperado do corpo (body) da requisição.
const loginSchema = z.object({
  email: z.email("e-mail inválido"),
  senha: z.string().min(1, "informe a senha"),
});

const trocarSenhaSchema = z.object({
  senha_atual: z.string().min(1),
  nova_senha: z.string().min(6, "mínimo 6 caracteres"),
});

export function criarAuthRoutes({ authController }) {
  // O Router é um "mini-app" que agrupa as rotas deste assunto.
  const router = express.Router();

  // Pública: é por aqui que se consegue o token.
  router.post("/login", validar(loginSchema), authController.login);

  // Protegidas: exigem token.
  router.get("/me", autenticar, authController.me);
  router.put("/senha", autenticar, validar(trocarSenhaSchema), authController.trocarSenha);

  return router;
}
