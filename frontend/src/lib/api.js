// Comunicação com o backend + sessão (token) guardada no navegador.

import { bimestreAtual, hojeLocalISO } from './utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const CHAVE_SESSAO = 'edutrackpro:sessao';
export const CHAVE_CONVERSA_SOPHOS = 'edutrackpro:sophos-ai';

// fetch que já manda o token e transforma { erro } da API em exceção.
export async function api(caminho, {
  metodo = 'GET',
  corpo,
  autenticada = true
} = {}) {
  const sessao = autenticada ? lerSessao() : null;

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(sessao && { Authorization: `Bearer ${sessao.token}` }),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  if (resposta.status === 401 && sessao) {
    sessaoExpirou();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Não foi possível falar com o servidor.');
  }

  return dados;
}

// Busca TODAS as páginas de uma listagem paginada da API e devolve só o array.
// As listagens devolvem no máximo 100 itens por vez ({ dados, paginacao });
// sem isso, o que passasse de 100 (ou de 10, sem "limite") sumia da tela.
export async function listarTodos(caminho) {
  const separador = caminho.includes('?') ? '&' : '?';
  const pagina = (n) => api(`${caminho}${separador}limite=100&pagina=${n}`);

  const primeira = await pagina(1);
  const itens = [...(primeira?.dados ?? [])];
  const totalPaginas = Math.min(primeira?.paginacao?.totalPaginas ?? 1, 50); // trava de segurança

  for (let n = 2; n <= totalPaginas; n++) {
    const resposta = await pagina(n);
    itens.push(...(resposta?.dados ?? []));
  }
  return itens;
}

// SophosAI (Gemini via backend). `historico` no formato do Gemini:
// [{ role: 'user' | 'model', parts: [{ text }] }]. Devolve { resposta }.
export function conversarComSophosAI({ mensagem, historico = [] }) {
  return api('/sophos-ai/chat', { metodo: 'POST', corpo: { mensagem, historico } });
}

export async function loginGoogle({ credential, perfil, lembrar = false }) {
  sair();
  const sessao = await api('/auth/google', {
    metodo: 'POST',
    corpo: { credential, perfil },
  });
  (lembrar ? localStorage : sessionStorage).setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  return sessao;
}

export async function login({ login, senha, perfil, lembrar }) {
  // Apaga a sessão anterior ANTES de entrar. Assim o login não manda um token
  // velho e não sobra uma sessão antiga no localStorage ("Lembrar de mim")
  // que seria lida no lugar da nova.
  sair();
  const sessao = await api('/auth/login', { metodo: 'POST', corpo: { login, senha, perfil, lembrar } });
  // "Lembrar de mim": localStorage sobrevive a fechar o navegador; sessionStorage não.
  (lembrar ? localStorage : sessionStorage).setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  return sessao; // { token, usuario: { id_usuario, nome, email, perfil } }
}

export function lerSessao() {
  if (typeof window === 'undefined') return null;
  try {
    const salvo = localStorage.getItem(CHAVE_SESSAO) || sessionStorage.getItem(CHAVE_SESSAO);
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
}

// ==================== Aluno: Notas (Boletim) ====================
export async function buscarMeuBoletim() {
  return await api('/boletim/meu');
}

export function sair() {
  localStorage.removeItem(CHAVE_SESSAO);
  sessionStorage.removeItem(CHAVE_SESSAO);
  sessionStorage.removeItem(CHAVE_CONVERSA_SOPHOS); // a conversa com a IA não passa para o próximo login
}

// Limpa a sessão e volta para o login com o aviso "sua sessão expirou".
export function sessaoExpirou() {
  sair();
  window.location.replace('/login?motivo=expirou');
}

// Quantos milissegundos faltam para o token vencer.
// O token tem 3 partes separadas por ponto; a do meio é o payload em base64
// com o "exp" (data de validade, em segundos) que o backend gravou.
// Isto NÃO é segurança, só serve para o front saber a hora de deslogar.
// Quem decide de verdade é o backend, que confere a assinatura e o exp.
export function msParaExpirar(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64));
    return exp * 1000 - Date.now();
  } catch {
    return 0; // token ilegível: tratamos como vencido
  }
}

// ==================== Aluno: Frequência ====================
// Faz a requisição para a rota da API que busca o resumo e os detalhes de faltas do aluno logado
export async function buscarMinhaPresenca() {
  return await api('/faltas_aluno/meu/detalhado');
}

// ==================== Aluno: Painel Inicial ====================
export async function buscarDashboardAluno() {
  // O backend já filtra /tarefa e /aviso pela turma do aluno logado.
  // O calendário também: só eventos confirmados, gerais ou da turma dele.
  const [resumoFaltas, listaTarefas, listaAvisos, listaCalendario] = await Promise.all([
    api('/faltas_aluno/meu'),
    listarTodos('/tarefa'),
    listarTodos('/aviso'),
    api('/calendario').catch(() => []),
  ]);

  // Pendência = tarefa que ainda não venceu (entrega hoje ou depois)
  const hoje = hojeLocalISO();
  const totalPendencias = listaTarefas.filter((t) => String(t.data_entrega).slice(0, 10) >= hoje).length;
  const totalAvisos = listaAvisos.length;

  const eventosAvisos = listaAvisos.map((a) => ({
    data: String(a.data_publicacao).slice(0, 10),
    tipo: a.titulo,
    descricao: a.texto ?? '',
  }));

  const eventosTarefas = listaTarefas.map((t) => ({
    data: String(t.data_entrega).slice(0, 10),
    tipo: `Entrega: ${t.titulo}`,
    descricao: t.descricao ?? '',
  }));

  return {
    pendencias: totalPendencias,
    mensagensNaoLidas: totalAvisos,
    faltas: resumoFaltas?.resumo?.faltas ?? resumoFaltas?.faltas ?? 0,
    eventos: [
      ...(Array.isArray(listaCalendario) ? listaCalendario : []).map((e) => ({
        data: e.data,
        tipo: e.tipo,
        descricao: e.descricao ?? '',
      })),
      ...eventosAvisos,
      ...eventosTarefas,
    ],
  };
}

/*
  Solicita um link para recuperação de senha.
  Não exige autenticação.
*/
export async function solicitarRecuperacaoSenha({ login }) {
  return await api('/auth/recuperar-senha', {
    metodo: 'POST',
    corpo: { login },
    autenticada: false,
  });
}

/*
  Define uma nova senha utilizando o token recebido por e-mail.
  Não exige autenticação.
*/
export async function redefinirSenha({ token, senha }) {
  return await api('/auth/redefinir-senha', {
    metodo: 'POST',
    corpo: { token, senha },
    autenticada: false,
  });
}

// ==================== Professor: Painel Inicial ====================
// Monta o painel do professor. Tudo parte dos vínculos (turma x disciplina)
// DELE, e cada consulta já vem filtrada por esses vínculos. Antes, o painel
// buscava listas gerais (/aluno, /aula, /faltas_aluno) sem "limite", e a API
// só devolve 10 itens por página: alunos de fora entravam na lista e aulas
// do dia ficavam de fora.
export async function buscarDashboardProfessor() {
  const sessao = lerSessao();
  const idProfessor = sessao?.usuario?.id_professor;

  const agora = new Date();
  const hojeISO = hojeLocalISO(agora);
  const bimestre = bimestreAtual(agora);
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const hojeNome = diasSemana[agora.getDay()];

  // 1) Vínculos do professor: [{ id_tdp, id_turma, nome (da turma), turno, disciplina }]
  const resTdp = idProfessor
    ? await api(`/turma_disciplina_professor/professor/${idProfessor}`).catch(() => ({ dados: [] }))
    : { dados: [] };
  const listaTdp = resTdp?.dados ?? [];
  const turmasUnicas = Array.from(new Map(listaTdp.map((t) => [Number(t.id_turma), t])).values());

  // 2) Em paralelo: alunos de cada turma, faltas, grade, notas do bimestre e chamada de hoje
  const [alunosPorTurma, listaFaltas, horariosPorTdp, notasPorTdp, chamadaHojePorTdp] = await Promise.all([
    Promise.all(
      turmasUnicas.map((t) =>
        listarTodos(`/aluno?id_turma=${t.id_turma}`).then((alunos) => alunos.map((a) => ({ ...a, turno: t.turno })))
      )
    ),
    listarTodos('/faltas_aluno').catch(() => []),
    Promise.all(listaTdp.map((t) => api(`/frequencia/horarios/${t.id_tdp}`).then((r) => r?.dados ?? []).catch(() => []))),
    Promise.all(
      listaTdp.map((t) =>
        api(`/nota/boletim?id_tdp=${t.id_tdp}&bimestre=${bimestre}`)
          .then((r) => r?.dados?.notas ?? [])
          .catch(() => [])
      )
    ),
    Promise.all(
      listaTdp.map((t) =>
        api(`/frequencia/chamada?id_tdp=${t.id_tdp}&data=${hojeISO}`)
          .then((r) => r?.dados?.aula ?? null)
          .catch(() => null)
      )
    ),
  ]);

  const nomeDaTurma = (tdp) => [tdp.nome, tdp.turno].filter(Boolean).join(' · ') || 'Turma';

  // 3) Aulas de hoje pela grade fixa
  const aulasHoje = [];
  listaTdp.forEach((tdp, i) => {
    horariosPorTdp[i]
      .filter((h) => h.dia_semana === hojeNome)
      .forEach((h) => {
        aulasHoje.push({
          id: `h-${h.id}`,
          idTdp: Number(tdp.id_tdp),
          hora: `${String(h.hora_inicio).slice(0, 5)} - ${String(h.hora_fim).slice(0, 5)}`,
          turma: nomeDaTurma(tdp),
          detalhe: tdp.disciplina || 'Aula',
        });
      });
  });

  // ...mais as chamadas registradas hoje fora da grade (ex.: aula de reposição)
  const tdpsComAulaHoje = new Set(aulasHoje.map((a) => a.idTdp));
  listaTdp.forEach((tdp, i) => {
    const aula = chamadaHojePorTdp[i];
    if (aula && !tdpsComAulaHoje.has(Number(tdp.id_tdp))) {
      aulasHoje.push({
        id: `aula-${aula.id_aula}`,
        idTdp: Number(tdp.id_tdp),
        hora: 'Chamada registrada',
        turma: nomeDaTurma(tdp),
        detalhe: tdp.disciplina || 'Aula',
      });
    }
  });
  aulasHoje.sort((a, b) => a.hora.localeCompare(b.hora));

  // 4) Alunos (só os das turmas do professor) com presença abaixo de 75%
  const mapaAlunos = new Map(alunosPorTurma.flat().map((a) => [Number(a.id_aluno), a]));
  const alunosBaixaFrequencia = listaFaltas
    .filter((f) => mapaAlunos.has(Number(f.id_aluno)) && Number(f.percentual_presenca) < 75)
    .map((f) => {
      const aluno = mapaAlunos.get(Number(f.id_aluno));
      return {
        id: Number(f.id_aluno),
        nome: f.aluno || aluno.nome,
        detalhe: [aluno.turma, aluno.turno].filter(Boolean).join(' · '),
        frequencia: Math.round(Number(f.percentual_presenca)),
      };
    })
    .sort((a, b) => a.frequencia - b.frequencia);

  // 5) Turmas com alguma disciplina do professor ainda sem nota no bimestre ATUAL
  //    (antes contava os 4 bimestres, inclusive os que nem começaram)
  const turmasSemNotaIds = new Set();
  listaTdp.forEach((tdp, i) => {
    if (notasPorTdp[i].length === 0) turmasSemNotaIds.add(Number(tdp.id_turma));
  });

  const disciplinasUnicas = [...new Set(listaTdp.map((t) => t.disciplina).filter(Boolean))];

  return {
    bimestreAtual: bimestre,
    totalAulasHoje: aulasHoje.length,
    turmasSemNota: turmasSemNotaIds.size,
    totalTurmas: turmasUnicas.length,
    totalBaixaFrequencia: alunosBaixaFrequencia.length,
    aulasHoje,
    alunosBaixaFrequencia,
    disciplinaPrincipal: disciplinasUnicas.length === 1 ? disciplinasUnicas[0] : 'suas turmas',
  };
}

// ==================== Administrador: Alunos ====================

//listar, cruzar as informações e formatalas para a tabelas de Alunos
export async function listarAlunosAdmin() {
  //disparando quatro requisições GET ao mesmo tempopara trazer todosos alunos cadastrados e suas respectivas turmas, turnos, dados cadastrais dos responsaveis e consulta as vw_faltas_alunos para obter o percentual de frequência (limit=100 para evitar cortes de página)
  const [resAlunos, resTurmas, resFaltas, resResponsaveis] = await Promise.all([
    listarTodos('/aluno').then((dados) => ({ dados })),
    listarTodos('/turma').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
    listarTodos('/faltas_aluno').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
    listarTodos('/responsavel').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
  ]);

  const listaAlunos = Array.isArray(resAlunos) ? resAlunos : (resAlunos?.dados ?? []);
  const listaTurmas = Array.isArray(resTurmas) ? resTurmas : (resTurmas?.dados ?? []);
  const listaFaltas = Array.isArray(resFaltas) ? resFaltas : (resFaltas?.dados ?? []);
  const listaResponsaveis = Array.isArray(resResponsaveis)
    ? resResponsaveis
    : (resResponsaveis?.dados ?? []);

  //agrupamento de todas as informações do aluno pelo ID correspondente
  const mapaTurmas = new Map(listaTurmas.map((t) => [Number(t.id_turma ?? t.id), t]));
  const mapaResponsaveis = new Map(
    listaResponsaveis.map((r) => [Number(r.id_responsavel ?? r.id), r])
  );

  // Calcula a média de presença do aluno a partir da view vw_faltas_aluno
  const mapaFreq = new Map();
  listaFaltas.forEach((f) => {
    const idAluno = Number(f.id_aluno);
    const freq = Number(f.frequencia ?? f.percentual_presenca ?? f.presenca_percentual);
    if (!Number.isFinite(freq)) return;
    const atual = mapaFreq.get(idAluno) || [];
    atual.push(freq);
    mapaFreq.set(idAluno, atual);
  });

  const alunos = listaAlunos.map((a) => {
    const idAluno = Number(a.id_aluno ?? a.id);
    const turmaObj = mapaTurmas.get(Number(a.id_turma));
    const respObj = mapaResponsaveis.get(Number(a.id_responsavel));
    const freqs = mapaFreq.get(idAluno);
    const presenca =
      freqs && freqs.length > 0
        ? Math.round(freqs.reduce((acc, v) => acc + v, 0) / freqs.length)
        : null;

    return {
      ...a,
      id: idAluno,
      id_aluno: idAluno,
      turma: a.turma || turmaObj?.nome || 'Sem turma',
      turno: a.turno || a.periodo || turmaObj?.periodo || turmaObj?.turno || '',
      responsavel: respObj?.nome || a.responsavel || '',
      responsavelDados: respObj
        ? {
            id_responsavel: Number(respObj.id_responsavel ?? respObj.id),
            nome: respObj.nome ?? '',
            cpf: respObj.cpf ?? '',
            parentesco: respObj.parentesco ?? '',
            telefone: respObj.telefone ?? '',
            email: respObj.email ?? '',
          }
        : null,
      presenca,
    };
  });

  const turmas = listaTurmas.map((t) => ({
    ...t,
    id: Number(t.id_turma ?? t.id),
    id_turma: Number(t.id_turma ?? t.id),
    nome: t.nome,
    turno: t.periodo || t.turno || '',
  }));

  return { alunos, turmas };
}

//alterações no banco dos dados do aluno e seus responsaveis
//alterações no banco dos dados do aluno e seus responsaveis
export async function atualizarAlunoAdmin(idAluno, idResponsavel, dados) {
  const { responsavelDados, ...camposAluno } = dados;

  const requisicoes = [
    api(`/aluno/${idAluno}`, {
      metodo: 'PUT',
      corpo: {
        id_turma: camposAluno.id_turma,
        nome: camposAluno.nome,
        cpf: camposAluno.cpf,
        email_institucional: camposAluno.email_institucional,
        endereco: camposAluno.endereco,
      },
    }),
  ];

  if (idResponsavel && responsavelDados) {
    requisicoes.push(
      api(`/responsavel/${idResponsavel}`, {
        metodo: 'PUT',
        corpo: {
          nome: responsavelDados.nome,
          cpf: responsavelDados.cpf || '000.000.000-00',
          parentesco: responsavelDados.parentesco || 'Outro',
          telefone: responsavelDados.telefone || '(00) 00000-0000',
          email: responsavelDados.email || null,
        },
      })
    );
  }

  const [alunoAtualizado] = await Promise.all(requisicoes);
  return alunoAtualizado;
}

export async function excluirAlunoAdmin(idAluno) {
  return await api(`/aluno/${idAluno}`, {
    metodo: 'DELETE',
  });
}

// ==================== Administrador: Professores ====================

//montagem da tabela e os filtros
export async function listarProfessoresAdmin() {
  //se baseia no mês em que estamos para verificar as notas do bimestre (mesma regra do backend)
  const bimestre = bimestreAtual();

  //faz seis requisições ao mesmo tempo e garante que se ouver rota vazia ou falha a tela não quebra 
  const [resProf, resTdp, resDisc, resTurmas, resAval, resNotas] = await Promise.all([
    listarTodos('/professor').then((dados) => ({ dados })),
    listarTodos('/turma_disciplina_professor').then((dados) => ({ dados })).catch(() => ({ turma_disciplina_professor: [] })),
    listarTodos('/disciplina').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
    listarTodos('/turma').then((dados) => ({ dados })).catch(() => ({ turmas: [] })),
    listarTodos('/avaliacao').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
    listarTodos('/nota').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
  ]);

  //montagem das linhas da tela filtrando os registros pertencentes ao professor
  const listaProf = Array.isArray(resProf) ? resProf : (resProf?.dados ?? []);
  const listaTdp = Array.isArray(resTdp)
    ? resTdp
    : (resTdp?.turma_disciplina_professor ?? resTdp?.dados ?? []);
  const listaDisc = Array.isArray(resDisc)
    ? resDisc
    : (resDisc?.disciplinas ?? resDisc?.dados ?? []);
  const listaTurmas = Array.isArray(resTurmas)
    ? resTurmas
    : (resTurmas?.turmas ?? resTurmas?.dados ?? []);
  const listaAval = Array.isArray(resAval)
    ? resAval
    : (resAval?.avaliacoes ?? resAval?.dados ?? []);
  const listaNotas = Array.isArray(resNotas)
    ? resNotas
    : (resNotas?.notas ?? resNotas?.dados ?? []);

  const mapaDisc = new Map(listaDisc.map((d) => [Number(d.id_disciplina ?? d.id), d]));
  const mapaTurmas = new Map(listaTurmas.map((t) => [Number(t.id_turma ?? t.id), t]));
  const avaliacoesComNota = new Set(listaNotas.map((n) => Number(n.id_avaliacao)));

  const professores = listaProf.map((p) => {
    const idProf = Number(p.id_professor ?? p.id);
    const vinculos = listaTdp.filter((v) => Number(v.id_professor) === idProf);

    //altera os IDs para nomes e remove duplicações 
    const nomesDisciplinas = [
      ...new Set(
        vinculos
          .map((v) => v.disciplina || v.nome_disciplina || mapaDisc.get(Number(v.id_disciplina))?.nome)
          .filter(Boolean)
      ),
    ];

    const turmasUnicas = new Map();
    vinculos.forEach((v) => {
      const turmaObj = mapaTurmas.get(Number(v.id_turma));
      const nome = v.turma || v.nome_turma || turmaObj?.nome;
      const turno = v.periodo || v.turno || turmaObj?.periodo || turmaObj?.turno || '';
      if (nome && !turmasUnicas.has(nome)) {
        turmasUnicas.set(nome, { nome, turno });
      }
    });

    const turmasDetalhes = Array.from(turmasUnicas.values());
    const nomesTurmas = turmasDetalhes.map((t) => t.nome);

    //calcula a situação de lançamento de notas do professor no bimestre atual
    let situacao = 'novo';
    if (vinculos.length > 0) {
      const idsTdp = new Set(vinculos.map((v) => Number(v.id ?? v.id_tdp)));
      const avalsBimestre = listaAval.filter(
        (a) => idsTdp.has(Number(a.id_tdp)) && Number(a.bimestre) === bimestre
      );

      if (avalsBimestre.length === 0) {
        situacao = 'atrasado';
      } else {
        const todasLancadas = avalsBimestre.every((a) =>
          avaliacoesComNota.has(Number(a.id_avaliacao ?? a.id))
        );
        situacao = todasLancadas ? 'em-dia' : 'atrasado';
      }
    }

    return {
      ...p,
      id: idProf,
      id_professor: idProf,
      disciplina: nomesDisciplinas.join(', ') || 'Sem disciplina',
      turmas: nomesTurmas.join(', ') || '–',
      turmasDetalhes,
      vinculos,
      situacao,
    };
  });

  const turmas = listaTurmas.map((t) => ({
    ...t,
    id: Number(t.id_turma ?? t.id),
    id_turma: Number(t.id_turma ?? t.id),
    nome: t.nome,
    turno: t.periodo || t.turno || '',
  }));

  const disciplinas = listaDisc.map((d) => ({
    ...d,
    id: Number(d.id_disciplina ?? d.id),
    id_disciplina: Number(d.id_disciplina ?? d.id),
    nome: d.nome,
  }));

  return { professores, turmas, disciplinas, bimestreAtual: bimestre };
}

// Atualiza dados pessoais do professor e sincroniza múltiplos vínculos (disciplinas x turmas)
export async function atualizarProfessorAdmin(professorAtual, dados, { turmasDisponiveis, disciplinasDisponiveis }) {
  const idProf = Number(professorAtual.id_professor ?? professorAtual.id);

  const mudouDadosPessoais =
    dados.nome !== professorAtual.nome ||
    dados.cpf !== professorAtual.cpf ||
    (dados.telefone || '') !== (professorAtual.telefone || '') ||
    dados.email !== professorAtual.email;

  if (mudouDadosPessoais) {
    await api(`/professor/${idProf}`, {
      metodo: 'PUT',
      corpo: {
        nome: dados.nome,
        cpf: dados.cpf,
        telefone: dados.telefone || undefined,
        email: dados.email,
      },
    });
  }

  // Separa múltiplas disciplinas (ex.: "História, Geografia")
  const nomesDisciplinasAlvo = (dados.disciplina || '')
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n && n !== 'Sem disciplina');

  // Aceita tanto array de IDs (dados.id_turmas) quanto string de nomes (dados.turmas)
  const idsTurmasAlvo = new Set(
    Array.isArray(dados.id_turmas)
      ? dados.id_turmas.map(Number).filter((id) => Number.isInteger(id) && id > 0)
      : turmasDisponiveis
          .filter((t) =>
            String(dados.turmas || '')
              .split(',')
              .map((n) => n.trim())
              .filter((n) => n && n !== '–')
              .includes(t.nome)
          )
          .map((t) => Number(t.id_turma ?? t.id))
  );

  if (nomesDisciplinasAlvo.length === 0 || idsTurmasAlvo.size === 0) return;

  // Garante que todas as disciplinas selecionadas existam no banco e coleta seus IDs
  const idsDisciplinasAlvo = new Set();
  for (const nomeDisc of nomesDisciplinasAlvo) {
    let discObj = disciplinasDisponiveis.find(
      (d) => d.nome.toLowerCase() === nomeDisc.toLowerCase()
    );

    if (!discObj) {
      const criada = await api('/disciplina', {
        metodo: 'POST',
        corpo: { nome: nomeDisc },
      });

      let idDiscCriada = Number(
        typeof criada === 'number'
          ? criada
          : (criada?.id_disciplina ?? criada?.id ?? criada?.dados?.id_disciplina ?? criada?.dados?.id)
      );

      if (!Number.isInteger(idDiscCriada) || idDiscCriada <= 0) {
        const resDiscAtualizada = await listarTodos('/disciplina');
        const listaDiscAtualizada = Array.isArray(resDiscAtualizada)
          ? resDiscAtualizada
          : Object.values(resDiscAtualizada || {}).find(Array.isArray) || [];

        const encontrada = listaDiscAtualizada.find(
          (d) => String(d.nome || '').trim().toLowerCase() === nomeDisc.toLowerCase()
        );
        idDiscCriada = Number(encontrada?.id_disciplina ?? encontrada?.id);
      }

      if (!Number.isInteger(idDiscCriada) || idDiscCriada <= 0) {
        throw new Error(`A disciplina "${nomeDisc}" não pôde ser vinculada porque o servidor não retornou o ID dela.`);
      }

      discObj = { id: idDiscCriada, nome: nomeDisc };
    }

    idsDisciplinasAlvo.add(Number(discObj.id));
  }

  const vinculosAtuais = professorAtual.vinculos || [];

  // 1. Remove vínculos cuja disciplina ou turma foram desmarcadas.
  //    O backend recusa (409) se o vínculo já tiver aulas, notas ou tarefas,
  //    para não apagar o histórico. Esses erros são juntados e mostrados no fim.
  const naoRemovidos = [];
  for (const v of vinculosAtuais) {
    const discMantida = idsDisciplinasAlvo.has(Number(v.id_disciplina));
    const turmaMantida = idsTurmasAlvo.has(Number(v.id_turma));
    const idVinculo = v.id_tdp ?? v.id_turma_disciplina_professor ?? v.id;
    if ((!discMantida || !turmaMantida) && idVinculo) {
      try {
        await api(`/turma_disciplina_professor/${idVinculo}`, { metodo: 'DELETE' });
      } catch (erro) {
        naoRemovidos.push(erro.message);
      }
    }
  }

  // 2. Cria todas as combinações (turma x disciplina) recém-selecionadas que ainda não existem
  const chavesJaVinculadas = new Set(
    vinculosAtuais.map((v) => `${Number(v.id_turma)}-${Number(v.id_disciplina)}`)
  );

  for (const idTurma of idsTurmasAlvo) {
    for (const idDisciplina of idsDisciplinasAlvo) {
      if (!chavesJaVinculadas.has(`${idTurma}-${idDisciplina}`)) {
        await api('/turma_disciplina_professor', {
          metodo: 'POST',
          corpo: {
            id_turma: idTurma,
            id_disciplina: idDisciplina,
            id_professor: idProf,
          },
        });
      }
    }
  }

  if (naoRemovidos.length > 0) {
    throw new Error(
      `Dados salvos, mas ${naoRemovidos.length} turma(s) não puderam ser retiradas do professor: ${naoRemovidos[0]}`
    );
  }
}

export async function excluirProfessorAdmin(idProfessor) {
  return await api(`/professor/${idProfessor}`, {
    metodo: 'DELETE',
  });
}

// Envia por e-mail o lembrete de notas pendentes (o servidor confere a situação do professor).
export async function enviarLembreteProfessor(idProfessor) {
  return await api(`/admin/professores/${idProfessor}/lembrete`, {
    metodo: 'POST',
  });
}

// ==================== Administrador: Turmas ====================
//chamadas simultâneas para fazer quatro requisições buscando os indicadores exigidos pela tabelada secretaria
export async function listarTurmasAdmin() {
  const [resTurmas, resAlunos, resDisc, resTdp] = await Promise.all([
    listarTodos('/turma').then((dados) => ({ dados })),
    listarTodos('/aluno').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
    listarTodos('/disciplina').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
    listarTodos('/turma_disciplina_professor').then((dados) => ({ dados })).catch(() => ({ dados: [] })),
  ]);

  const listaTurmas = Array.isArray(resTurmas) ? resTurmas : (resTurmas?.dados ?? []);
  const listaAlunos = Array.isArray(resAlunos) ? resAlunos : (resAlunos?.dados ?? []);
  const listaDisc = Array.isArray(resDisc) ? resDisc : (resDisc?.dados ?? []);
  const listaTdp = Array.isArray(resTdp)
    ? resTdp
    : (resTdp?.turma_disciplina_professor ?? resTdp?.dados ?? []);

  const totalDisciplinasBase = listaDisc.length;

  return listaTurmas.map((t) => {
    const idTurma = Number(t.id_turma ?? t.id);
    const qtdAlunos = listaAlunos.filter((a) => Number(a.id_turma) === idTurma).length;

    const disciplinasComProf = new Set(
      listaTdp
        .filter((v) => Number(v.id_turma) === idTurma && v.id_professor)
        .map((v) => Number(v.id_disciplina))
    );

    const semProfessor = Math.max(0, totalDisciplinasBase - disciplinasComProf.size);

    return {
      ...t,
      id: idTurma,
      id_turma: idTurma,
      nome: t.nome,
      turno: t.periodo || t.turno || '',
      periodo: t.periodo || t.turno || '',
      ano_letivo: t.ano_letivo ?? new Date().getFullYear(),
      sala: t.sala || `Ano ${t.ano_letivo ?? new Date().getFullYear()}`,
      alunos: qtdAlunos,
      semProfessor,
    };
  });
}

export async function criarTurmaAdmin(dados) {
  return await api('/turma', {
    metodo: 'POST',
    corpo: {
      nome: dados.nome,
      periodo: dados.turno || dados.periodo,
      ano_letivo: Number(dados.ano_letivo || new Date().getFullYear()),
    },
  });
}

export async function atualizarTurmaAdmin(idTurma, dados) {
  return await api(`/turma/${idTurma}`, {
    metodo: 'PUT',
    corpo: {
      nome: dados.nome,
      periodo: dados.turno || dados.periodo,
      ano_letivo: Number(dados.ano_letivo || new Date().getFullYear()),
    },
  });
}

export async function excluirTurmaAdmin(idTurma) {
  return await api(`/turma/${idTurma}`, {
    metodo: 'DELETE',
  });
}

// ---------- Admin: dados vindos do banco (via /api/admin) ----------

// "3A" -> "3ª Série A"
export const nomeTurma = (nome = '') =>
  /^\d[A-Za-z]$/.test(nome) ? `${nome[0]}ª Série ${nome[1].toUpperCase()}` : nome;

const turmaParaTela = (t) => ({
  ...t,
  id: t.id_turma,
  nome: nomeTurma(t.nome),
  nomeCurto: t.nome,
  turno: t.periodo,
  semProfessor: Math.max(Number(t.sem_professor) || 0, 0),
  alunos: Number(t.alunos) || 0,
});

const alunoParaTela = (a) => ({
  ...a,
  turma: nomeTurma(a.turma),
  presenca: a.presenca === null || a.presenca === undefined ? null : Number(a.presenca),
});

export const admin = {
  resumo: () => api('/admin/resumo'),
  turmas: async () => (await api('/admin/turmas')).map(turmaParaTela),
  criarTurma: async (corpo) => turmaParaTela(await api('/admin/turmas', { metodo: 'POST', corpo })),
  responsaveis: () => api('/admin/responsaveis'),
  alunos: async () => (await api('/admin/alunos')).map(alunoParaTela),
  criarAluno: (corpo) => api('/admin/alunos', { metodo: 'POST', corpo }),
  salvarAluno: async (id, corpo) =>
    alunoParaTela(await api(`/admin/alunos/${id}`, { metodo: 'PUT', corpo })),
  excluirAluno: (id) => api(`/admin/alunos/${id}`, { metodo: 'DELETE' }),
  professores: () => api('/admin/professores'),
  criarProfessor: (corpo) => api('/admin/professores', { metodo: 'POST', corpo }),
  salvarProfessor: (id, corpo) => api(`/admin/professores/${id}`, { metodo: 'PUT', corpo }),
  excluirProfessor: (id) => api(`/admin/professores/${id}`, { metodo: 'DELETE' }),
  criarAdministrador: (corpo) => api('/admin/administradores', { metodo: 'POST', corpo }),
};
