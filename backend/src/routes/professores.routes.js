// =====================================================================
// routes/professores.routes.js
// Prefixo: /api/professores
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, parcial, campos } from "../middlewares/validacao.js";

const campoBase = z.object({
  nome: z.string().min(1).max(120),
  cpf: campos.cpf,
  telefone: z.string().max(20).nullish(),
});

const criarSchema = campoBase.extend({
  email: z.email(),
  senha: z.string().min(6, "mínimo 6 caracteres"),
});

export function criarProfessoresRoutes({ professoresController }) {
  const router = express.Router();
  router.use(autenticar);

  // ---------------- painel do professor ("me" antes de "/:id") ----------------
  const soProfessor = exigirPerfil("professor");
  router.get("/me/turmas", soProfessor, professoresController.minhasTurmas);
  router.get("/me/horarios", soProfessor, professoresController.meusHorarios);

  // ---------------- cadastro (somente admin) ----------------
  const soAdmin = exigirPerfil("admin");
  router.get("/", soAdmin, professoresController.listar);
  router.get("/:id", soAdmin, professoresController.buscar);
  router.post("/", soAdmin, validar(criarSchema), professoresController.criar);
  router.put("/:id", soAdmin, validar(parcial(campoBase)), professoresController.atualizar);
  router.delete("/:id", soAdmin, professoresController.remover);

  return router;
}
