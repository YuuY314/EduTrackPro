// =====================================================================
// middlewares/autorizacao.js
// Barra quem não tem o PERFIL certo. Sempre vem DEPOIS de autenticar.
//
//   router.get("/", autenticar, exigirPerfil("professor", "admin"), ...)
//
// Diferença importante:
//   401 = "não sei quem você é" (sem login)
//   403 = "sei quem você é, mas você não pode fazer isso"
// =====================================================================

import { AppError } from "../utils/AppError.js";

// Recebe a lista de perfis permitidos e devolve o middleware.
// (É uma função que retorna outra função: "fábrica de middleware".)
export function exigirPerfil(...perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      throw new AppError("Você não tem permissão para acessar este recurso", 403);
    }
    next();
  };
}
