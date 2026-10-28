// =====================================================================
// routes/avaliacoes.routes.js
// Prefixo: /api/avaliacoes   (professor e admin)
// Inclui o lançamento de notas, que é "filho" da avaliação:
//   /avaliacoes/:id/notas  e  /avaliacoes/:id/notas/:idAluno
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, parcial, campos } from "../middlewares/validacao.js";

const campoBase = z.object({
  titulo: z.string().min(1).max(100),
  bimestre: z.number().int().min(1).max(4),
  peso: z.number().positive().max(99.99).optional(),
  data: campos.data.nullish(),
});

const criarSchema = campoBase.extend({ id_tdp: campos.id });

const notaSchema = z.object({ valor: campos.nota });

const loteSchema = z.object({
  notas: z.array(z.object({ id_aluno: campos.id, valor: campos.nota })).min(1),
});

export function criarAvaliacoesRoutes({ avaliacoesController }) {
  const router = express.Router();
  router.use(autenticar, exigirPerfil("professor", "admin")); // vale para TODAS as rotas abaixo

  router.post("/", validar(criarSchema), avaliacoesController.criar);
  router.get("/", avaliacoesController.listar);
  router.put("/:id", validar(parcial(campoBase)), avaliacoesController.atualizar);
  router.delete("/:id", avaliacoesController.remover);

  // notas
  router.get("/:id/notas", avaliacoesController.listarNotas);
  router.put("/:id/notas", validar(loteSchema), avaliacoesController.lancarNotasEmLote);
  router.put("/:id/notas/:idAluno", validar(notaSchema), avaliacoesController.lancarNota);

  return router;
}
