# Sophos Academy

Sistema acadêmico em Next.js (App Router), com telas de aluno, professor e administração.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Você cai na tela de login.
No protótipo, qualquer e-mail e senha (4+ caracteres) entram no perfil escolhido.

## Pastas

```
app/
├── layout.jsx            ← layout raiz (fontes + CSS global)
├── globals.css          ← estilos de todas as páginas
├── page.jsx              ← "/" redireciona para /login
├── login/               ← tela de login (page.jsx + login.css)
├── aluno/               ← layout.jsx com o header do aluno
│   ├── page.jsx          ← /aluno (início)
│   ├── boletim/
│   └── presenca/
├── professor/           ← layout.jsx com o header do professor
│   ├── page.jsx          ← /professor (início)
│   ├── turmas/
│   ├── chamada/         ← page.jsx + Chamada.jsx (parte interativa)
│   └── notas/           ← page.jsx + Notas.jsx
└── admin/               ← layout.jsx com o header da administração
    ├── page.jsx          ← /admin (painel)
    ├── alunos/          ← page.jsx + Alunos.jsx
    ├── professores/     ← page.jsx + Professores.jsx
    ├── turmas/
    └── calendario/      ← page.jsx + Calendario.jsx

components/              ← peças (.jsx) reaproveitadas (Header, CartaoNumero, Etiqueta, Agenda...)
lib/dados.js             ← dados de exemplo (trocar pelas chamadas à API)
lib/utils.js             ← funções de cor da nota, média e datas
public/img/              ← logo e ícones
```

## O que falta para virar sistema de verdade

- **Login:** o `app/login/page.jsx` só redireciona. Trocar pela chamada à API de autenticação
  e proteger as rotas `/aluno`, `/professor` e `/admin` (por exemplo com `middleware`).
- **Dados:** tudo vem de `lib/dados.js`. Trocar por `fetch` para a API.
- **Salvar:** os botões "Salvar" só mostram a confirmação na tela.
