# Revisão do EduTrackPro — correções de 25/11/2026

Este arquivo explica **o que estava errado, por que estava errado e o que foi mudado**.
Os arquivos alterados têm comentários no próprio código explicando o "antes" e o "depois".

## Como aplicar

1. Substitua as pastas `backend/`, `frontend/` e `database/` pelas desta versão (o seu `backend/.env` foi mantido igual).
2. **Não precisa recriar o banco**: nenhuma tabela mudou.
3. Rode a verificação (só leitura) para achar dados que os bugs antigos já possam ter estragado:
   `mysql -u root -p edutrackpro < database/migracoes/2026-11-25-verificar-conflitos-grade.sql`
   As duas primeiras consultas devem voltar vazias. Se aparecer algo, abra o professor em
   **Admin → Professores → Editar** e troque o horário que está em conflito.
4. Se usam Docker/Coolify, confira as novas variáveis no `.env` (ver item 9).

---

## 1. Os 3 bugs que vocês encontraram

### Bug A — Editar professor: várias turmas e várias matérias
**O que acontecia:** o formulário tinha dois campos soltos, "Disciplinas" e "Turmas", e o backend
(`ProfessorModel.sincronizarVinculosEHorarios`) cruzava **tudo com tudo**. Um professor de Matemática
no 3A e Física no 3B virava Matemática **e** Física no 3A **e** no 3B (4 vínculos em vez de 2).
Além disso, cada horário guardava só a turma, não a matéria: ao salvar, o backend "chutava" a matéria
(`mapaTdp.get(turma)` pegava a última da lista), então as aulas de quem dá 2 matérias na mesma turma
trocavam de matéria sozinhas.

**Correção:**
- A seção **2. Aulas** agora tem uma linha por **par turma + disciplina** (`SecaoVinculos.jsx`, novo),
  igual à tabela `turma_disciplina_professor`.
- Cada horário (seção **3. Horários**) aponta para uma dessas linhas ("3A · Matemática").
  Trocar a disciplina de uma linha leva os horários junto; remover a linha remove os horários dela.
- O backend recebe `vinculos: [{ id_turma, disciplina }]` e `horarios: [{ id_turma, disciplina, dia, hora_inicio }]`
  e **recusa com mensagem clara** horário de turma/disciplina que não está na lista (antes adivinhava).

### Bug B — Horário da chamada não bate com a grade ("Semana" x "1ª Aula")
**O que acontecia:** havia três "grades" diferentes no sistema:
- o banco (cronograma do 3A): 5 aulas, **com intervalo** das 09:30 às 09:50;
- o cadastro do admin (`SecaoHorarios.jsx`): 6 aulas seguidas **sem intervalo** (09:30, 10:20, 11:10…), então
  horários do banco como 09:50 apareciam em branco ao editar;
- a chamada (`Chamada.jsx`): "1ª aula" era a posição da aula **entre as aulas daquele professor no dia**
  (Matemática às 07:50 aparecia como "1ª aula", mas é a 2ª da turma) e, em dia sem aula, aparecia só "Segunda 07:00".

**Correção:** novo `frontend/src/lib/grade.js` com **a grade única** (a do banco) e uma função de rótulo usada
no admin, na chamada e no painel do professor. Agora tudo aparece no mesmo padrão:
- dia com aula: `2ª aula · 07:50–08:40 · Sala 3A`
- dia sem aula (reposição): `Segunda · 2ª aula · 07:50–08:40 · Sala 3A`
- horário fora da grade: `Aula extra · 08:00–08:50` (nunca some da tela)

> A grade da **Manhã** é exatamente a do banco. As da **Tarde** e **Noite** seguem o mesmo modelo
> (3 aulas, intervalo, 2 aulas). Se a escola usar outros horários, altere só a tabela `GRADE` em `lib/grade.js`.

### Bug C — Professor recém-criado: alterações não salvam ("algumas já vêm prontas")
**O que acontecia (reproduzido no banco de teste):**
1. No banco de teste a turma 3A já tem as 11 disciplinas com professor (dados do 3º bimestre). Ao escolher,
   por exemplo, Matemática no 3A para o professor novo, o backend respondia **409** ("já possui outro professor").
2. A página `Professores.jsx` **engolia esse erro** (`try/catch` sem repassar) e o modal fechava mesmo assim.
   O erro aparecia numa linha pequena atrás do modal, então parecia que "não salvou e não disse nada".
3. Quando a disciplina era livre, o horário escolhido podia ser o mesmo de outra matéria da turma
   (ex.: segunda 07:00, que é Português) e o sistema **aceitava**: a 3A ficava com duas aulas ao mesmo tempo.
4. Com só uma turma cadastrada, o campo turma já vem preenchido — é isso que "vinha pronto".

**Correção:**
- O erro volta para o modal, que **continua aberto** e mostra o motivo ao lado do botão Salvar.
- As disciplinas que já têm professor naquela turma aparecem **bloqueadas com o nome de quem dá a aula**;
  os horários já ocupados na turma aparecem bloqueados com "Ocupado: Português (Helena Carvalho)".
- O backend também valida (para não depender só da tela): disciplina de outro professor → 409 com o nome
  do professor; horário que choca com outra aula da turma → 409 dizendo qual aula; professor em duas aulas
  ao mesmo tempo → 409.

---

## 2. Erros silenciosos encontrados e corrigidos

Ordem: do mais perigoso para o menos.

| # | Onde | O que acontecia | Por que corrigir |
|---|------|-----------------|------------------|
| 1 | `ProfessorModel` (editar professor) | Desmarcar uma turma **apagava o vínculo** e, por `ON DELETE CASCADE`, **todas as chamadas, notas e tarefas** daquela turma/disciplina. Sem aviso. | Perda de dados irreversível. Agora recusa ("já existem aulas, notas ou tarefas lançadas") e a linha fica travada na tela. |
| 2 | `ProfessorModel` (horários) | Cada "Salvar" **apagava e recriava todos os horários**. Os ids mudavam, as chamadas já feitas perdiam o horário (`aulas.id_horario = NULL`) e, em aula dupla, a chamada de um horário podia aparecer no outro. A sala ("Sala 3A", "Quadra") também era apagada. | Agora sincroniza por diferença: o que não mudou fica com o mesmo id e a mesma sala. |
| 3 | `Notas.jsx` e `Chamada.jsx` | Se a busca das notas/chamada salvas falhasse, o erro era engolido (`.catch(() => vazio)`): a tela mostrava tudo em branco / todos presentes e **"Salvar" apagava** o que já estava lançado. | Agora mostra o erro e bloqueia o botão Salvar até recarregar. |
| 4 | Aula, Avaliação, Tarefa, Aviso (controllers) | Um professor podia **editar ou apagar registros das turmas de outros professores** só trocando o id na URL (ex.: `PUT /api/tarefa/1`). Em aviso, qualquer um podia "assinar" por outro (`id_autor` vinha do corpo). | Falha de segurança. Agora o professor só mexe no que é dele (`garantirAcessoRegistro` em `utils/permissoes.js`); o autor do aviso vem do banco. |
| 5 | `AvisoService.atualizar` | Editar um aviso trocava a **data de publicação para hoje** e exigia mandar `id_autor`. | Mantém autor e data originais. |
| 6 | `atualizarAlunoAdmin` (api.js) | Salvava aluno e responsável em **duas requisições paralelas** (se uma falhasse, a outra ficava gravada pela metade) e preenchia campos vazios do responsável com **dados falsos** (`000.000.000-00`, `(00) 00000-0000`, "Outro"). | Agora usa `/admin/alunos/:id` (uma transação; campo vazio = mantém o que estava). |
| 7 | `EditarAluno.jsx` | Chamava `onSalvar` sem `await` e fechava o modal na hora: erro de e-mail/CPF repetido aparecia depois, atrás. | Espera a resposta; em erro o modal fica aberto com o motivo. |
| 8 | Cadastro (`admin/cadastro`) | Com "Usar o mesmo email do usuário" desmarcado, o **e-mail de acesso digitado era descartado**: a pessoa só conseguia entrar com o e-mail de contato. | Agora envia `email_login` (acesso) separado de `email` (contato). Ao editar o professor, o login só acompanha o contato se os dois eram iguais. |
| 9 | `docker-compose.yml` | O backend no Docker não recebia `FRONTEND_URL`, `GMAIL_*`, `LOGO_URL`, `GEMINI_MODEL*`, `JWT_EXPIRES_LEMBRAR`. Resultado em produção: **CORS bloqueando o site** (só liberava `localhost:3000`), links de e-mail como `undefined/redefinir-senha` e e-mails sem enviar. O `MYSQL_DATABASE` padrão era `app_db` (o usuário do app não teria acesso ao `edutrackpro`). | Variáveis repassadas e padrão corrigido. Também adicionadas ao `.env.example`. |
| 10 | Editar professor com CPF/e-mail vazio | O backend transformava `""` em `NULL` numa coluna `NOT NULL` → **"Erro interno no servidor"** (500) sem explicar. | Validação na tela e no backend com mensagem clara. Telefone agora pode ser apagado (antes era ignorado). |
| 11 | Excluir professor | Professor com turmas (mesmo sem nenhuma aula dada) não podia ser excluído e a mensagem era genérica. Professor que tinha publicado um **aviso** também travava ("registro está em uso"), porque o aviso aponta para o login dele. | Vínculos sem histórico saem junto. Com histórico (chamada, nota ou tarefa), a exclusão é recusada dizendo qual turma impede: antes use **Transferir** (seção 2.1). Os avisos do professor passam a ter como autor o admin que fez a exclusão (os alunos continuam vendo). Turmas, alunos e notas **nunca** são apagados. |
| 12 | Links "Chamada"/"Notas" (Minhas turmas e painel) | Sempre abriam a **primeira** turma da lista. O parâmetro `?turma=` era comparado com o id da turma **ou** do vínculo, então `turma=1` podia abrir a disciplina errada. | Links agora levam `?tdp=` (e `&horario=` no painel). `?turma=` continua aceito, só como id da turma. |
| 13 | `Chamada.jsx` ao trocar de turma | O horário da turma anterior ficava selecionado por um instante; a chamada era buscada com o horário errado. | Zera horário/estado ao trocar de turma e só carrega quando os horários novos chegam. |
| 14 | Filtro de disciplina (Admin → Professores) | Usava "contém": filtrar **Física** mostrava também quem dá **Educação Física**. | Compara a disciplina inteira. |
| 15 | Situação das notas (Admin → Professores, painel do admin, lembrete por e-mail e painel do professor) | Cada tela calculava "Atrasado/Em dia" de um jeito: o painel e o lembrete aceitavam **uma nota qualquer** como "em dia"; a tela de Professores era mais rígida (e baixava **todas as notas da escola** para isso); o painel do professor só olhava se havia alguma nota. As telas podiam discordar. | **Regra rígida em todas** (decisão do grupo): a turma/disciplina está pendente se não tem avaliação no bimestre **ou** se alguma avaliação (Prova 1, Prova 2, Trabalho) ainda não tem nenhuma nota. Fica em um lugar só no servidor (`TDP_PENDENTE` em `AdminService.js`) e o painel do professor usa a mesma conta. |
| 16 | `AdminService` | Tinha uma cópia própria da sincronização de professor (`sincronizarAulas`) com regras diferentes. | Agora delega para o `ProfessorService` (uma regra só). |
| 17 | `Notas.jsx` | Abria no 3º bimestre quando o bimestre atual era o 1º ou 2º. Média vazia aparecia **vermelha** em "Minhas turmas". | Abre no bimestre atual; média vazia fica neutra. |
| 18 | Painel do professor — "Frequência baixa em Matemática" | Usava a frequência **geral** do aluno (todas as matérias somadas, `vw_faltas_aluno`). Um aluno que faltava muito em Matemática podia não aparecer, e outro aparecia por faltar em outra matéria. | Novo `GET /api/frequencia/resumo/:id_tdp` calcula a presença **só nas aulas daquela turma/disciplina**. O painel lista cada aluno abaixo de 75% com turma, disciplina e "X faltas em Y aulas". |
| 19 | `backend/.env.example` | `GEMINI_MODEL=seu_modelo_do_gemini`: quem copiasse o exemplo teria erro 404 na SophosAI. | Vazio = usa o padrão do código. |

### 2.1 Transferir turma/disciplina para outro professor (novo)

**Por que existe:** as notas, chamadas e tarefas ficam presas ao vínculo turma + disciplina (ex.: "3A · Matemática").
Apagar o vínculo apagaria, por `ON DELETE CASCADE`, o boletim e a frequência dos alunos. Por isso um vínculo com
histórico não pode ser removido — mas sem uma forma de passá-lo adiante, o professor ficaria impossível de excluir.

**Como usar:** Admin → Professores → **Editar** → em "Aulas", clique em **Transferir para outro professor** na linha,
escolha o novo professor e confirme. A transferência é gravada na hora (não precisa "Salvar alterações").

**O que acontece:** só muda o dono do vínculo (`turma_disciplina_professor.id_professor`). Notas, chamadas, tarefas
e horários continuam iguais e passam a aparecer para o professor novo (painel, chamada, notas, lembrete).
É recusada se o professor novo já tiver outra aula no mesmo dia e horário.

**Para excluir um professor que já deu aula:** transfira cada turma dele e depois clique em Excluir.

Arquivos: `POST /api/professor/:id/transferir` (`ProfessorModel.transferirVinculo`, `ProfessorService`,
`ProfessorController`, `ProfessorRoutes`), `SecaoVinculos.jsx`, `EditarProfessor.jsx`, `Professores.jsx`, `api.js`.

---

## 3. E-mail de login x e-mail de contato (explicação)

O sistema guarda dois e-mails para cada professor/administrador:
- **e-mail de login** (tabela `usuarios`): o que a pessoa digita para **entrar**;
- **e-mail de contato** (tabela `professores`): o que aparece na lista e para onde vai o **lembrete de notas**.

Na tela **Novo cadastro**, a seção 1 pede o e-mail de login e a seção 2 tem a caixa
"Usar o mesmo email do usuário". Exemplo, com a caixa **desmarcada**:
- login: `helena.carvalho@escola.edu.br`
- contato: `helena.pessoal@gmail.com`

**Antes:** o e-mail de login digitado era jogado fora e o sistema gravava o de contato nos dois lugares.
A Helena tentava entrar com `helena.carvalho@escola.edu.br` e recebia "e-mail ou senha incorretos".
**Agora:** cada um vai para o seu lugar. Ela entra com o da escola e recebe o lembrete no Gmail.

Ao **editar** o professor, só existe o campo do e-mail de contato:
- se os dois eram **iguais** (caso normal, caixa marcada no cadastro), trocar o contato troca o login junto, como antes;
- se eram **diferentes**, trocar o contato **não mexe no login**, para a pessoa não ficar sem conseguir entrar sem saber por quê.

Se o grupo preferir **um e-mail só**, basta tirar a caixa "Usar o mesmo email do usuário" da tela de cadastro.

## 4. Encontrados, mas NÃO alterados (decisão do grupo)

Deixei de fora porque mudam regra de negócio ou exigem mexer no banco. Vale discutir antes da apresentação:

- **Pesos das notas do 3º bimestre mudam ao salvar.** O banco de teste tem "Prova" (peso 0,60) e "Trabalho" (0,40).
  Ao salvar notas, o `NotaModel` renomeia para o padrão Prova 1/Prova 2/Trabalho e troca os pesos para 0,40/0,30.
  O boletim do aluno nesse bimestre muda de valor.
- **Média parcial:** o boletim do aluno (`vw_boletim`) calcula a média só com as notas que existem; a tela do professor
  mostra "–" enquanto falta alguma nota. Os dois deveriam seguir a mesma regra.
- **Não há tela para criar disciplina nova.** No banco de teste a 3A está completa, então um professor novo
  só consegue aulas em outra turma (ou depois de tirar a disciplina de alguém).
- Aluno consegue abrir `/api/aviso/:id`, `/api/tarefa/:id` e `/api/calendario/:id` de outras turmas pelo id (só leitura).
- Excluir uma turma transforma os eventos de calendário dela em eventos "de todas as turmas" (`ON DELETE SET NULL`).
- Editar o responsável pela tela de um aluno altera o responsável de **todos** os irmãos ligados a ele (é como a tabela foi pensada).
- `components/GerenciarTurma.jsx` não é usado em lugar nenhum (código morto).
- O seed (`01-edutrackpro.sql`) tem um aluno de teste com um **e-mail pessoal real** (Gmail). Melhor trocar por um fictício.
- `npm run lint` já acusava 23 avisos `react-hooks/set-state-in-effect` antes da revisão; continua com 23 (não são bugs de funcionamento).

---

## 5. Como foi testado

- Banco MySQL 8 criado do zero com `database/init/01-edutrackpro.sql`.
- Bug C reproduzido no código **antigo** (409 escondido; duas aulas na 3A na segunda às 07:00) e conferido no novo.
- Testes de API: matéria de outro professor (409 com nome), horário ocupado (409 dizendo qual aula),
  horário sem vínculo (422), CPF vazio (400), tirar matéria com notas (409), salvar sem mudanças
  mantém ids e salas, chamada continua ligada ao horário depois de editar o professor, professor
  tentando editar tarefa/aula de outro (403), aviso de outro autor (403), cadastro com e-mail de login diferente.
- Testes no navegador (Chrome): modal com disciplinas bloqueadas, erro aparecendo no modal aberto,
  salvamento do professor novo na turma 2B, e rótulos da chamada:
  segunda `2ª aula · 07:50–08:40 · Sala 3A`; sábado (reposição) `Quinta · 4ª aula · 09:50–10:40 · Sala 3A`.
- Regra rígida: no 4º bimestre sem avaliações todos aparecem "Atrasado"; Ricardo com a coluna Prova 2 vazia continua "Atrasado"; com as 3 colunas lançadas passa a "Em dia" (painel do admin, lista e lembrete concordam).
- Frequência por matéria: Ricardo vê 4 alunos com 50% em Matemática ("1 falta em 2 aulas"); não consegue consultar a disciplina de outro professor (403).
- Transferência: excluir o Ricardo é recusado (Matemática 3A tem notas); "Transferir" para a Paula move as 42 notas e os 4 horários; depois disso o Ricardo é excluído e o aviso que ele publicou passa para a secretaria.
- `next build` sem erros; lint com o mesmo número de avisos de antes.
