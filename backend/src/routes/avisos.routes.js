// =====================================================================
// routes/avisos.routes.js
// Prefixo: /api/avisos   (professor e admin)
// O aluno vê os avisos dele em GET /api/alunos/me/avisos.
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, parcial, campos } from "../middlewares/validacao.js";

const textoBase = z.object({
  titulo: z.string().min(1).max(150),
  texto: z.string().min(1),
});

// id_turma omitido/null = aviso geral (só admin pode; o service confere).
const criarSchema = textoBase.extend({ id_turma: campos.id.nullish() });

export function criarAvisosRoutes({ avisosController }) {
  const router = express.Router();
  router.use(autenticar, exigirPerfil("professor", "admin"));

  router.post("/", validar(criarSchema), avisosController.criar);
  router.get("/", avisosController.listar);
  router.put("/:id", validar(parcial(textoBase)), avisosController.atualizar);
  router.delete("/:id", avisosController.remover);

  return router;
}
