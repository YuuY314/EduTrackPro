// =====================================================================
// routes/turmas.routes.js
// Prefixo: /api/turmas
//
// É aqui que o professor navega: escolhe a turma -> vê os alunos ->
// "entra" em um aluno. Cada rota confere no service se o professor
// realmente leciona naquela turma.
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, parcial, campos } from "../middlewares/validacao.js";

const campoBase = z.object({
  nome: z.string().min(1).max(10), // 3A, 3B...
  periodo: z.enum(["Manhã", "Tarde", "Noite"]),
  ano_letivo: z.number().int().min(2000).max(2100),
});

const atribuirSchema = z.object({
  id_disciplina: campos.id,
  id_professor: campos.id,
});

export function criarTurmasRoutes({ turmasController }) {
  const router = express.Router();
  router.use(autenticar);

  const professorOuAdmin = exigirPerfil("professor", "admin");
  const soAdmin = exigirPerfil("admin");

  // ---------- consulta (professor e admin) ----------
  router.get("/", professorOuAdmin, turmasController.listar);
  router.get("/:idTurma", professorOuAdmin, turmasController.buscar);
  router.get("/:idTurma/alunos", professorOuAdmin, turmasController.listarAlunos);
  router.get("/:idTurma/alunos/:idAluno", professorOuAdmin, turmasController.detalheDoAluno);
  router.get("/:idTurma/disciplinas", professorOuAdmin, turmasController.listarDisciplinas);

  // ---------- gestão (somente admin) ----------
  router.post("/", soAdmin, validar(campoBase), turmasController.criar);
  router.put("/:idTurma", soAdmin, validar(parcial(campoBase)), turmasController.atualizar);
  router.delete("/:idTurma", soAdmin, turmasController.remover);

  router.post("/:idTurma/disciplinas", soAdmin, validar(atribuirSchema), turmasController.atribuirDisciplina);
  router.delete("/:idTurma/disciplinas/:idTdp", soAdmin, turmasController.removerDisciplina);

  return router;
}
