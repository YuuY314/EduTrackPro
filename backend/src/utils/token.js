// =====================================================================
// utils/token.js
// Gera e verifica o token JWT, que é o "crachá" que o front-end recebe
// no login e envia em toda requisição seguinte.
//
// O token carrega alguns dados (id, perfil...) e é ASSINADO com o
// JWT_SECRET. Se alguém alterar o conteúdo, a assinatura deixa de bater
// e verificarToken() lança erro.
// =====================================================================

import jwt from "jsonwebtoken";
import { ambiente } from "../config/ambiente.js";
import { AppError } from "./AppError.js";

// Cria o token a partir dos dados do usuário.
export function gerarToken(dados) {
  return jwt.sign(dados, ambiente.jwt.segredo, { expiresIn: ambiente.jwt.expira });
}

// Confere assinatura e validade. Devolve os dados que estavam no token.
export function verificarToken(token) {
  try {
    return jwt.verify(token, ambiente.jwt.segredo);
  } catch {
    // expirado, adulterado, malformado... para o cliente tudo é "inválido"
    throw new AppError("Token inválido ou expirado. Faça login novamente.", 401);
  }
}
