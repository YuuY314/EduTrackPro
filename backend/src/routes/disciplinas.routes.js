// =====================================================================
// routes/disciplinas.routes.js
// Prefixo: /api/disciplinas   (qualquer logado lista; só admin altera)
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar } from "../middlewares/validacao.js";

const schema = z.object({ nome: z.string().min(1).max(60) });

export function criarDisciplinasRoutes({ disciplinasController }) {
  const router = express.Router();
  router.use(autenticar);

  router.get("/", disciplinasController.listar);

  const soAdmin = exigirPerfil("admin");
  router.post("/", soAdmin, validar(schema), disciplinasController.criar);
  router.put("/:id", soAdmin, validar(schema), disciplinasController.atualizar);
  router.delete("/:id", soAdmin, disciplinasController.remover);

  return router;
}
