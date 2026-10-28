// =====================================================================
// app.js  -  PONTO DE ENTRADA DO SISTEMA
//
// Faz duas coisas:
//  1) MONTA as peças (pool -> models -> services -> controllers -> rotas),
//     ligando uma na outra ("injeção de dependência");
//  2) configura o Express e sobe o servidor.
//
// Caminho de uma requisição (exemplo: aluno pede o boletim):
//   GET /api/alunos/me/boletim
//     -> routes   (autentica o token e confere o perfil)
//     -> controller (pega o id do aluno no token)
//     -> service  (junta médias e notas, organiza o resultado)
//     -> model    (executa o SQL no MySQL)
//     <- o resultado volta pelo mesmo caminho e vira JSON
// =====================================================================

import express from "express";
import cors from "cors";

import { ambiente } from "./config/ambiente.js"; // também carrega o .env
import { criarPool } from "./config/database.js";
import { criarRotas } from "./routes/index.js";
import { naoEncontrado, tratarErros } from "./middlewares/tratarErros.js";

// ---- models (SQL) ----
import { criarUsuariosModel } from "./models/usuarios.model.js";
import { criarAlunosModel } from "./models/alunos.model.js";
import { criarProfessoresModel } from "./models/professores.model.js";
import { criarTurmasModel } from "./models/turmas.model.js";
import { criarDisciplinasModel } from "./models/disciplinas.model.js";
import { criarHorariosModel } from "./models/horarios.model.js";
import { criarAvaliacoesModel } from "./models/avaliacoes.model.js";
import { criarAulasModel } from "./models/aulas.model.js";
import { criarTarefasModel } from "./models/tarefas.model.js";
import { criarAvisosModel } from "./models/avisos.model.js";

// ---- services (regras de negócio) ----
import { criarPermissoesService } from "./services/permissoes.service.js";
import { criarAuthService } from "./services/auth.service.js";
import { criarAlunosService } from "./services/alunos.service.js";
import { criarProfessoresService } from "./services/professores.service.js";
import { criarTurmasService } from "./services/turmas.service.js";
import { criarDisciplinasService } from "./services/disciplinas.service.js";
import { criarHorariosService } from "./services/horarios.service.js";
import { criarAvaliacoesService } from "./services/avaliacoes.service.js";
import { criarAulasService } from "./services/aulas.service.js";
import { criarTarefasService } from "./services/tarefas.service.js";
import { criarAvisosService } from "./services/avisos.service.js";

// ---- controllers (HTTP) ----
import { criarAuthController } from "./controller/auth.controller.js";
import { criarAlunosController } from "./controller/alunos.controller.js";
import { criarProfessoresController } from "./controller/professores.controller.js";
import { criarTurmasController } from "./controller/turmas.controller.js";
import { criarDisciplinasController } from "./controller/disciplinas.controller.js";
import { criarHorariosController } from "./controller/horarios.controller.js";
import { criarAvaliacoesController } from "./controller/avaliacoes.controller.js";
import { criarAulasController } from "./controller/aulas.controller.js";
import { criarTarefasController } from "./controller/tarefas.controller.js";
import { criarAvisosController } from "./controller/avisos.controller.js";

// ---------------------------------------------------------------------
// 1) MONTAGEM DAS PEÇAS
// ---------------------------------------------------------------------
const pool = criarPool(); // UM pool compartilhado por todos os models

// Models: só precisam do pool.
const usuariosModel = criarUsuariosModel({ pool });
const alunosModel = criarAlunosModel({ pool });
const professoresModel = criarProfessoresModel({ pool });
const turmasModel = criarTurmasModel({ pool });
const disciplinasModel = criarDisciplinasModel({ pool });
const horariosModel = criarHorariosModel({ pool });
const avaliacoesModel = criarAvaliacoesModel({ pool });
const aulasModel = criarAulasModel({ pool });
const tarefasModel = criarTarefasModel({ pool });
const avisosModel = criarAvisosModel({ pool });

// Services: recebem os models de que precisam (e às vezes outros services).
const permissoes = criarPermissoesService({ turmasModel });
const authService = criarAuthService({ usuariosModel });
const alunosService = criarAlunosService({
  alunosModel,
  turmasModel,
  horariosModel,
  tarefasModel,
  avisosModel,
});
const professoresService = criarProfessoresService({ professoresModel, turmasModel, horariosModel });
const turmasService = criarTurmasService({ turmasModel, alunosModel, alunosService, permissoes });
const disciplinasService = criarDisciplinasService({ disciplinasModel });
const horariosService = criarHorariosService({ horariosModel, turmasModel, permissoes });
const avaliacoesService = criarAvaliacoesService({ avaliacoesModel, alunosModel, permissoes });
const aulasService = criarAulasService({ aulasModel, alunosModel, permissoes });
const tarefasService = criarTarefasService({ tarefasModel, permissoes });
const avisosService = criarAvisosService({ avisosModel, permissoes });

// Controllers: recebem o service correspondente.
const controllers = {
  authController: criarAuthController({ authService }),
  alunosController: criarAlunosController({ alunosService }),
  professoresController: criarProfessoresController({ professoresService }),
  turmasController: criarTurmasController({ turmasService }),
  disciplinasController: criarDisciplinasController({ disciplinasService }),
  horariosController: criarHorariosController({ horariosService }),
  avaliacoesController: criarAvaliacoesController({ avaliacoesService }),
  aulasController: criarAulasController({ aulasService }),
  tarefasController: criarTarefasController({ tarefasService }),
  avisosController: criarAvisosController({ avisosService }),
};

// ---------------------------------------------------------------------
// 2) CONFIGURAÇÃO DO EXPRESS
// ---------------------------------------------------------------------
const app = express();

app.use(cors()); // permite que o front-end (outra porta/origem) chame a API
app.use(express.json()); // converte o corpo JSON das requisições em req.body

// Rota de teste simples.
app.get("/", (req, res) => {
  res.json({ mensagem: "API do sistema escolar no ar" });
});

// Confere se a API consegue falar com o banco.
app.get("/api/saude", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", banco: "conectado" });
});

// Todas as rotas do sistema ficam sob /api.
app.use("/api", criarRotas(controllers));

// IMPORTANTE: estes dois vêm POR ÚLTIMO.
app.use(naoEncontrado); // nenhuma rota casou -> 404
app.use(tratarErros); // qualquer erro lançado acima cai aqui

// ---------------------------------------------------------------------
// 3) SOBE O SERVIDOR (só depois de confirmar que o banco responde)
// ---------------------------------------------------------------------
try {
  await pool.query("SELECT 1");
  console.log("Conectado ao MySQL");
} catch (erro) {
  console.error("Não foi possível conectar ao MySQL. Confira o .env e se o banco está rodando.");
  console.error(erro.message);
  process.exit(1);
}

app.listen(ambiente.porta, () => {
  console.log(`Servidor rodando na porta ${ambiente.porta}`);
});
