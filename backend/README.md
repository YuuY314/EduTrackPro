# Back-end - EduTrackPro

API em **Node.js + Express 5 + MySQL** (ES Modules, `mysql2`, `jsonwebtoken`, `bcryptjs`).

## Como rodar

```bash
npm install
cp .env.example .env        # ajuste DB_PORT / DB_USER / DB_PASSWORD do seu MySQL
```

1. Importe o banco: `mysql -u root -p < ../database/init/01-edutrackpro.sql`
   (cria o banco `edutrackpro` com a turma 3A; todos os usuários já vêm com a senha **123456**).
2. `npm run dev` (reinicia sozinho ao salvar) ou `npm start`.
3. Abra `http://localhost:8080/api/health`: deve responder `{"status":"ok"}`.

### Logins de teste (senha `123456`)

| Perfil    | E-mail ou RA |
|-----------|--------------|
| Aluno     | `ana.souza@aluno.escola.edu.br` ou `20263A001` |
| Professor | `ricardo.menezes@escola.edu.br` |
| Admin     | `secretaria@escola.edu.br` |

### Token de teste sem passar pelo login

```bash
npm run token          # admin (usuário 32)
npm run token -- 12    # qualquer id_usuario
```

Envie em `Authorization: Bearer <token>`.

## Estrutura

```
src/
  server.js               sobe o servidor
  app.js                  helmet, cors, rotas, 404 e erros
  config/
    ambiente.js           lê e valida o .env
    database.js           pool único do MySQL + emTransacao()
  middlewares/
    autenticar.js         autenticar (exige token) e exigirPerfil('admin', ...)
    errorHandler.js       erros padronizados { "erro": "..." }
  routes/                 caminho + middlewares -> controller
  controllers/            lê req, chama o service, devolve res
  services/               regras de negócio (validação, transação, senha)
  models/                 SQL puro
  utils/                  AppError, token (JWT), senha (bcrypt), validacoes, sql
  dev-utils/
    generateInitialToken.js   npm run token
```

### Por que não há controller/service de Admin nem de Usuário?

- **Admin** não é uma tabela, é um valor de `usuarios.perfil`. O que muda para o admin é
  *o que ele pode acessar*, e isso é resolvido na rota com `exigirPerfil('admin')`.
- **Usuário** é o login. O que se faz com ele é autenticar (`AuthService`). Criar/apagar
  usuário acontece junto com o aluno/professor, dentro de uma transação, então o
  `UsuarioModel` (SQL) existe, mas não precisa de controller/service próprios.
- **Aluno** e **Professor** têm tabelas e cadastros próprios, por isso têm o trio
  model -> service -> controller.

## Endpoints (prefixo `/api`)

Erros: `{ "erro": "mensagem" }` com `400` dados inválidos, `401` sem login, `403` sem permissão,
`404` não encontrado, `409` duplicado/em uso, `422` referência inválida.

| Método | Rota | Quem | O que faz |
|---|---|---|---|
| POST | `/auth/login` | público | `{login, senha, perfil, lembrar?}` -> `{token, usuario}` |
| GET | `/auth/me` | logado | dados do usuário do token |
| GET | `/alunos?pagina=&limite=` | admin, professor | lista paginada |
| GET | `/alunos/:id` | admin, professor | um aluno |
| POST | `/alunos` | admin | `{matricula, nome, cpf, email_institucional, senha, id_turma, id_responsavel, endereco?}` (cria o login junto) |
| PUT | `/alunos/:id` | admin | atualiza só os campos enviados |
| DELETE | `/alunos/:id` | admin | remove aluno + login |
| GET/POST/PUT/DELETE | `/professores`, `/professores/:id` | admin | mesmo padrão: `{nome, cpf, email, senha, telefone?}` |
| GET | `/health` | público | testa API + MySQL |
