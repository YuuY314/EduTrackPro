# Back-end - Sistema escolar

API em **Node.js + Express 5 + MySQL** (ES Modules, `mysql2`, JWT).

## Como rodar

```bash
npm install
cp .env.example .env        # depois edite o .env com seus dados do MySQL
```

1. Importe o banco: `mysql -u root -p < database/sistema_escolar.sql`
   (cria o banco `sistema_escolar`, as tabelas e os dados da turma 3A).
2. `npm run seed:senhas` define a senha **123456** para todos os usuários de teste.
3. `npm run dev` (reinicia sozinho ao salvar) ou `npm start`.
4. Abra `http://localhost:3000/api/saude`: deve responder `{"status":"ok"}`.

### Logins de teste (senha `123456`)

| Perfil    | E-mail                          |
|-----------|---------------------------------|
| Aluno     | ana.souza@aluno.escola.edu.br   |
| Professor | ricardo.menezes@escola.edu.br (Matemática) |
| Admin     | secretaria@escola.edu.br        |

Os 11 professores seguem o padrão `nome.sobrenome@escola.edu.br`; os 20 alunos,
`nome.sobrenome@aluno.escola.edu.br`. Veja o arquivo `requests.http` para testar.

## Estrutura de pastas

```
app.js                  monta tudo (pool -> models -> services -> controllers -> rotas) e sobe o servidor
config/
  ambiente.js           lê e valida o .env
  database.js           pool do MySQL + helper de transação
middlewares/
  autenticacao.js       exige token JWT válido
  autorizacao.js        exige o perfil certo (aluno/professor/admin)
  validacao.js          valida o body com zod
  tratarErros.js        respostas de erro padronizadas { "erro": "..." }
routes/                 caminho + middlewares -> controller   (sem lógica)
controller/             lê req, chama o service, devolve res  (sem regra, sem SQL)
services/               regras de negócio e permissões
models/                 SQL puro
utils/                  AppError, senha (bcrypt), token (jwt), helpers
scripts/                definirSenhasDeTeste.js
database/               sistema_escolar.sql
```

### Caminho de uma requisição

```
GET /api/alunos/me/boletim
  routes      alunos.routes.js       autenticar -> exigirPerfil("aluno")
  controller  alunos.controller.js   pega o id_aluno do TOKEN
  services    alunos.service.js      junta médias + notas e organiza
  models      alunos.model.js        executa o SQL
```

### Em que ordem ler o código

1. `config/ambiente.js` e `config/database.js`
2. `utils/` e `middlewares/`
3. Um domínio simples completo: `disciplinas` (model -> service -> controller -> routes)
4. `app.js` (veja como as peças se encaixam)
5. `auth` (login e token)
6. `alunos` (área do aluno) e `turmas` / `avaliacoes` / `aulas` (área do professor)
7. `services/permissoes.service.js` (a regra "professor só mexe no que leciona")

## Conceitos que aparecem no código

- **Injeção de dependência**: cada arquivo exporta uma função que recebe o que precisa
  (`criarXModel({ pool })`) em vez de importar direto. O `app.js` faz as ligações.
- **tdp** = tabela `turma_disciplina_professor` ("quem dá qual matéria em qual turma").
  Horários, aulas, avaliações e tarefas são ligados a ele; por isso o cronograma muda
  conforme a turma e o professor só acessa o que leciona.
- **O aluno usa `/me`**: o id vem do token, nunca da URL.
- **Express 5** encaminha erros de funções `async` para o `tratarErros` sozinho.

## Endpoints (prefixo `/api`)

Resposta de sucesso: `200` (GET), `201` (criação, devolve o id), `204` (atualização/remoção).
Erros: `{ "erro": "mensagem" }` com `400` dados inválidos, `401` sem login, `403` sem permissão,
`404` não encontrado, `409` duplicado/em uso, `422` referência inválida.
Enviar o token em `Authorization: Bearer <token>`.

### Auth
| Método | Rota | Quem | O que faz |
|---|---|---|---|
| POST | `/auth/login` | público | `{email, senha}` -> `{token, usuario}` |
| GET | `/auth/me` | logado | dados do usuário logado |
| PUT | `/auth/senha` | logado | `{senha_atual, nova_senha}` |

### Aluno (id vem do token)
| Método | Rota | O que faz |
|---|---|---|
| GET | `/alunos/me` | ficha: turma e responsável |
| GET | `/alunos/me/home` | resumo: pendências, faltas, próximas tarefas, últimos avisos |
| GET | `/alunos/me/horarios` | cronograma da turma |
| GET | `/alunos/me/boletim` | notas e médias por disciplina/bimestre |
| GET | `/alunos/me/frequencia` | total de faltas, % e detalhe |
| GET | `/alunos/me/tarefas` | tarefas da turma |
| GET | `/alunos/me/avisos` | avisos da turma + gerais |

### Professor
| Método | Rota | O que faz |
|---|---|---|
| GET | `/professores/me/turmas` | turmas dele (com `id_tdp` de cada disciplina) |
| GET | `/professores/me/horarios` | agenda semanal |
| GET | `/turmas/:idTurma/alunos` | alunos da turma |
| GET | `/turmas/:idTurma/alunos/:idAluno` | "entrar no aluno": ficha, notas e faltas das disciplinas dele |
| POST | `/avaliacoes` | `{id_tdp, titulo, bimestre, peso?, data?}` |
| GET | `/avaliacoes?turma=&tdp=&bimestre=` | lista (filtros opcionais) |
| PUT/DELETE | `/avaliacoes/:id` | edita/remove |
| GET | `/avaliacoes/:id/notas` | alunos da turma com a nota atual |
| PUT | `/avaliacoes/:id/notas/:idAluno` | `{valor}` lança/corrige a nota de um aluno |
| PUT | `/avaliacoes/:id/notas` | `{notas:[{id_aluno, valor}]}` em lote |
| POST | `/aulas` | `{id_tdp, data, conteudo?}` registra a aula do dia |
| GET | `/aulas?turma=&tdp=&data=` | lista aulas |
| GET | `/aulas/:id/frequencias` | tela de chamada (presente: true/false/null) |
| PUT | `/aulas/:id/frequencias` | `{frequencias:[{id_aluno, presente, justificativa?}]}` |
| PATCH | `/aulas/:id/frequencias/:idAluno` | `{presente, justificativa?}` marca/corrige uma falta |
| POST/GET/PUT/DELETE | `/tarefas` (GET exige `?turma=`) | tarefas |
| POST/GET/PUT/DELETE | `/avisos` | professor: só da turma dele; admin: também gerais (sem `id_turma`) |
| GET | `/horarios?turma=` | cronograma de uma turma |

### Admin
| Método | Rota | O que faz |
|---|---|---|
| GET/POST/PUT/DELETE | `/alunos`, `/alunos/:id` | cadastro de alunos (cria login + responsável junto) |
| GET/POST/PUT/DELETE | `/professores`, `/professores/:id` | cadastro de professores |
| POST/PUT/DELETE | `/turmas`, `/turmas/:idTurma` | turmas |
| GET/POST/DELETE | `/turmas/:idTurma/disciplinas` | atribui disciplina + professor à turma (cria o tdp) |
| GET/POST/PUT/DELETE | `/disciplinas` (GET liberado a todos logados) | disciplinas |
| POST/PUT/DELETE | `/horarios`, `/horarios/:id` | monta o cronograma |

## Dicas

- O `.env` **não** vai para o Git. Troque `JWT_SECRET` por uma string longa e aleatória.
- Em produção, não rode `seed:senhas`: cada usuário deve ter a própria senha.
- Para criar a 3B, 3C...: `POST /turmas`, `POST /alunos`, `POST /turmas/:id/disciplinas`
  e `POST /horarios`, ou adicione INSERTs no SQL.
