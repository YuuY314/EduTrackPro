// =====================================================================
// routes/aulas.routes.js
// Prefixo: /api/aulas   (professor e admin)
// Aula = registro de que a aula aconteceu; frequências = a chamada dela.
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, campos } from "../middlewares/validacao.js";

const criarSchema = z.object({
  id_tdp: campos.id,
  data: campos.data,
  conteudo: z.string().max(255).nullish(),
});

const chamadaSchema = z.object({
  frequencias: z
    .array(
      z.object({
        id_aluno: campos.id,
        presente: z.boolean(),
        justificativa: z.string().max(255).nullish(),
      })
    )
    .min(1),
});

const ajusteSchema = z.object({
  presente: z.boolean(),
  justificativa: z.string().max(255).nullish(),
});

export function criarAulasRoutes({ aulasController }) {
  const router = express.Router();
  router.use(autenticar, exigirPerfil("professor", "admin"));

  router.post("/", validar(criarSchema), aulasController.criar);
  router.get("/", aulasController.listar);

  router.get("/:id/frequencias", aulasController.listarFrequencias);
  router.put("/:id/frequencias", validar(chamadaSchema), aulasController.salvarChamada);
  router.patch("/:id/frequencias/:idAluno", validar(ajusteSchema), aulasController.ajustarFrequencia);

  return router;
}
