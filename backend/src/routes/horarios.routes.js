// =====================================================================
// routes/horarios.routes.js
// Prefixo: /api/horarios
// Consulta:  GET /api/horarios?turma=1   (admin e professor da turma)
// Gestão:    POST/PUT/DELETE            (somente admin)
// (O aluno usa GET /api/alunos/me/horarios.)
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, parcial, campos } from "../middlewares/validacao.js";

const campoBase = z.object({
  dia_semana: campos.diaSemana,
  hora_inicio: campos.hora,
  hora_fim: campos.hora,
  sala: z.string().max(30).nullish(),
});

const criarSchema = campoBase.extend({ id_tdp: campos.id });

export function criarHorariosRoutes({ horariosController }) {
  const router = express.Router();
  router.use(autenticar);

  router.get("/", exigirPerfil("professor", "admin"), horariosController.listar);

  const soAdmin = exigirPerfil("admin");
  router.post("/", soAdmin, validar(criarSchema), horariosController.criar);
  router.put("/:id", soAdmin, validar(parcial(campoBase)), horariosController.atualizar);
  router.delete("/:id", soAdmin, horariosController.remover);

  return router;
}
