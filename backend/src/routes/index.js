// =====================================================================
// routes/index.js
// Junta todos os routers e define o PREFIXO de cada grupo de rotas.
// Ex.: criarAlunosRoutes + "/alunos"  =>  /api/alunos/me/boletim
// =====================================================================

import express from "express";
import { criarAuthRoutes } from "./auth.routes.js";
import { criarAlunosRoutes } from "./alunos.routes.js";
import { criarProfessoresRoutes } from "./professores.routes.js";
import { criarTurmasRoutes } from "./turmas.routes.js";
import { criarHorariosRoutes } from "./horarios.routes.js";
import { criarDisciplinasRoutes } from "./disciplinas.routes.js";
import { criarAvaliacoesRoutes } from "./avaliacoes.routes.js";
import { criarAulasRoutes } from "./aulas.routes.js";
import { criarTarefasRoutes } from "./tarefas.routes.js";
import { criarAvisosRoutes } from "./avisos.routes.js";

// "controllers" é um objeto com todos os controllers, montado no app.js.
export function criarRotas(controllers) {
  const router = express.Router();

  router.use("/auth", criarAuthRoutes(controllers));
  router.use("/alunos", criarAlunosRoutes(controllers));
  router.use("/professores", criarProfessoresRoutes(controllers));
  router.use("/turmas", criarTurmasRoutes(controllers));
  router.use("/horarios", criarHorariosRoutes(controllers));
  router.use("/disciplinas", criarDisciplinasRoutes(controllers));
  router.use("/avaliacoes", criarAvaliacoesRoutes(controllers));
  router.use("/aulas", criarAulasRoutes(controllers));
  router.use("/tarefas", criarTarefasRoutes(controllers));
  router.use("/avisos", criarAvisosRoutes(controllers));

  return router;
}
