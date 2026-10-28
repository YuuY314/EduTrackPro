// =====================================================================
// middlewares/autenticacao.js
// "Porteiro" das rotas protegidas: exige um token JWT válido.
//
// O front-end envia o token no cabeçalho:
//     Authorization: Bearer eyJhbGciOi...
// Se estiver ok, colocamos os dados do usuário em req.usuario e
// deixamos a requisição seguir (next). Senão, respondemos 401.
// =====================================================================

import { AppError } from "../utils/AppError.js";
import { verificarToken } from "../utils/token.js";

export function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || ""; // "Bearer <token>"
  const [tipo, token] = cabecalho.split(" ");

  if (tipo !== "Bearer" || !token) {
    throw new AppError("Faça login para acessar este recurso", 401);
  }

  // req.usuario = { id_usuario, perfil, id_aluno?, id_professor? }
  req.usuario = verificarToken(token);
  next();
}
