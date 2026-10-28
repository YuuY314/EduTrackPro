// =====================================================================
// routes/tarefas.routes.js
// Prefixo: /api/tarefas   (professor e admin)
// O aluno vê as tarefas dele em GET /api/alunos/me/tarefas.
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, parcial, campos } from "../middlewares/validacao.js";

const campoBase = z.object({
  titulo: z.string().min(1).max(120),
  descricao: z.string().nullish(),
  data_entrega: campos.data,
});

const criarSchema = campoBase.extend({ id_tdp: campos.id });

export function criarTarefasRoutes({ tarefasController }) {
  const router = express.Router();
  router.use(autenticar, exigirPerfil("professor", "admin"));

  router.post("/", validar(criarSchema), tarefasController.criar);
  router.get("/", tarefasController.listar);
  router.put("/:id", validar(parcial(campoBase)), tarefasController.atualizar);
  router.delete("/:id", tarefasController.remover);

  return router;
}
