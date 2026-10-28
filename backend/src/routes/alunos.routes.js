// =====================================================================
// routes/alunos.routes.js
// Prefixo (definido no routes/index.js): /api/alunos
//
// ATENÇÃO À ORDEM: "/me/..." precisa vir ANTES de "/:id". Se fosse o
// contrário, o Express acharia que "me" é um id.
// =====================================================================

import express from "express";
import { z } from "zod";
import { autenticar } from "../middlewares/autenticacao.js";
import { exigirPerfil } from "../middlewares/autorizacao.js";
import { validar, parcial, campos } from "../middlewares/validacao.js";

const responsavelSchema = z.object({
  nome: z.string().min(1),
  cpf: campos.cpf,
  telefone: z.string().min(8),
  email: z.email().nullish(), // opcional (pode faltar ou ser null)
  parentesco: z.string().min(1),
});

// Para cadastrar, o admin informa um responsável NOVO (objeto "responsavel")
// ou um já existente (id_responsavel, útil para irmãos).
const campoBase = z.object({
  nome: z.string().min(1).max(120),
  cpf: campos.cpf,
  matricula: z.string().min(1).max(20),
  endereco: z.string().max(200).nullish(),
  id_turma: campos.id,
});

const criarSchema = campoBase
  .extend({
    email_institucional: z.email(),
    senha: z.string().min(6, "mínimo 6 caracteres"),
    id_responsavel: campos.id.optional(),
    responsavel: responsavelSchema.optional(),
  })
  .refine((d) => d.id_responsavel || d.responsavel, {
    message: "Informe id_responsavel ou responsavel",
    path: ["responsavel"],
  });

export function criarAlunosRoutes({ alunosController }) {
  const router = express.Router();

  // Tudo daqui para baixo exige login.
  router.use(autenticar);

  // ---------------- área do aluno (id vem do token) ----------------
  const soAluno = exigirPerfil("aluno");
  router.get("/me", soAluno, alunosController.minhaFicha);
  router.get("/me/home", soAluno, alunosController.home);
  router.get("/me/horarios", soAluno, alunosController.meusHorarios);
  router.get("/me/boletim", soAluno, alunosController.meuBoletim);
  router.get("/me/frequencia", soAluno, alunosController.minhaFrequencia);
  router.get("/me/tarefas", soAluno, alunosController.minhasTarefas);
  router.get("/me/avisos", soAluno, alunosController.meusAvisos);

  // ---------------- cadastro (somente admin) ----------------
  const soAdmin = exigirPerfil("admin");
  router.get("/", soAdmin, alunosController.listar);
  router.get("/:id", soAdmin, alunosController.buscar);
  router.post("/", soAdmin, validar(criarSchema), alunosController.criar);
  router.put("/:id", soAdmin, validar(parcial(campoBase)), alunosController.atualizar);
  router.delete("/:id", soAdmin, alunosController.remover);

  return router;
}
