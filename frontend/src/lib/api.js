// Comunicação com o backend + sessão (token) guardada no navegador.

import { bimestreAtual, hojeLocalISO } from './utils';
import { rotuloAula } from './grade';

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

  // 2) Em paralelo: presença por disciplina, grade, notas do bimestre e chamada de hoje
  const [resumoPorTdp, horariosPorTdp, boletimPorTdp, chamadaHojePorTdp] = await Promise.all([
    // presença de cada aluno NA MATÉRIA do professor (antes: frequência geral do
    // aluno somando todas as matérias, que não dizia nada sobre a aula dele)
    Promise.all(
      listaTdp.map((t) => api(`/frequencia/resumo/${t.id_tdp}`).then((r) => r?.dados ?? []).catch(() => []))
    ),
    Promise.all(listaTdp.map((t) => api(`/frequencia/horarios/${t.id_tdp}`).then((r) => r?.dados ?? []).catch(() => []))),
    Promise.all(
      listaTdp.map((t) =>
        api(`/nota/boletim?id_tdp=${t.id_tdp}&bimestre=${bimestre}`)
          .then((r) => r?.dados ?? { avaliacoes: [], notas: [] })
          .catch(() => null)
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
          // mesmo rótulo da chamada e do cadastro de horários (lib/grade.js)
          hora: rotuloAula({ ...h, turno: tdp.turno }, { comSala: false }),
          ordem: String(h.hora_inicio).slice(0, 5),
          turma: nomeDaTurma(tdp),
          detalhe: tdp.disciplina || 'Aula',
          // abre a chamada já na turma/disciplina e no horário certos
          link: `/professor/chamada?tdp=${tdp.id_tdp}&horario=${h.id}`,
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
        ordem: '99:99',
        turma: nomeDaTurma(tdp),
        detalhe: tdp.disciplina || 'Aula',
        link: `/professor/chamada?tdp=${tdp.id_tdp}`,
      });
    }
  });
  aulasHoje.sort((a, b) => a.ordem.localeCompare(b.ordem));

  // 4) Alunos com presença abaixo de 75% NA DISCIPLINA do professor.
  //    Um aluno pode aparecer duas vezes se estiver mal em duas matérias dele.
  const alunosBaixaFrequencia = [];
  listaTdp.forEach((tdp, i) => {
    resumoPorTdp[i]
      .filter((r) => r.total_aulas > 0 && r.percentual_presenca !== null && r.percentual_presenca < 75)
      .forEach((r) => {
        alunosBaixaFrequencia.push({
          id: `${r.id_aluno}-${tdp.id_tdp}`,
          idAluno: Number(r.id_aluno),
          nome: r.aluno,
          detalhe: `${nomeDaTurma(tdp)} · ${tdp.disciplina} · ${r.faltas} ${r.faltas === 1 ? 'falta' : 'faltas'} em ${r.total_aulas} ${r.total_aulas === 1 ? 'aula' : 'aulas'}`,
          frequencia: Math.round(r.percentual_presenca),
        });
      });
  });
  alunosBaixaFrequencia.sort((a, b) => a.frequencia - b.frequencia);

  // 5) Turmas com notas pendentes no bimestre ATUAL - MESMA regra rígida do
  //    admin (AdminService.TDP_PENDENTE): pendente se não tem avaliação no
  //    bimestre ou se alguma avaliação ainda não tem nenhuma nota.
  const turmasSemNotaIds = new Set();
  listaTdp.forEach((tdp, i) => {
    const boletim = boletimPorTdp[i];
    if (!boletim) return; // não carregou: não acusa pendência sem saber
    const comNota = new Set(boletim.notas.map((n) => Number(n.id_avaliacao)));
    const pendente =
      boletim.avaliacoes.length === 0 || boletim.avaliacoes.some((a) => !comNota.has(Number(a.id_avaliacao)));
    if (pendente) turmasSemNotaIds.add(Number(tdp.id_turma));
  });

  const disciplinasUnicas = [...new Set(listaTdp.map((t) => t.disciplina).filter(Boolean))];

  return {
    bimestreAtual: bimestre,
    totalAulasHoje: aulasHoje.length,
    turmasSemNota: turmasSemNotaIds.size,
    totalTurmas: turmasUnicas.length,
    totalBaixaFrequencia: new Set(alunosBaixaFrequencia.map((a) => a.idAluno)).size,
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

// Salva aluno + responsável numa TRANSAÇÃO só (/admin/alunos/:id).
// Antes eram dois PUTs em paralelo (/aluno e /responsavel): se um falhasse o
// outro ficava gravado pela metade, e campos vazios do responsável eram
// preenchidos com dados falsos ("000.000.000-00", "(00) 00000-0000", "Outro").
// Campo vazio agora = "manter o que já estava" (o backend usa COALESCE).
export async function atualizarAlunoAdmin(idAluno, _idResponsavel, dados) {
  const { responsavelDados } = dados;
  return await api(`/admin/alunos/${idAluno}`, {
    metodo: 'PUT',
    corpo: {
      id_turma: dados.id_turma,
      nome: dados.nome,
      cpf: dados.cpf,
      email_institucional: dados.email_institucional,
      endereco: dados.endereco,
      ...(responsavelDados && {
        responsavel: {
          nome: responsavelDados.nome,
          cpf: responsavelDados.cpf,
          parentesco: responsavelDados.parentesco,
          telefone: responsavelDados.telefone,
          email: responsavelDados.email || null,
        },
      }),
    },
  });
}

export async function excluirAlunoAdmin(idAluno) {
  return await api(`/aluno/${idAluno}`, {
    metodo: 'DELETE',
  });
}

// ==================== Administrador: Professores ====================

// Monta a tabela de professores e os dados do modal de edição.
// O /professor já devolve, de cada professor, os vínculos (turma + disciplina)
// e os horários. A situação das notas vem do /admin/professores, que usa a
// MESMA regra do painel do admin (antes esta tela recalculava com outra regra
// e baixava TODAS as notas da escola só para isso, e o painel e esta tela
// podiam discordar sobre quem estava atrasado).
// Nada aqui "engole" erro: com dados faltando o modal mostraria o professor sem
// turmas e, ao salvar, tiraria as turmas dele.
export async function listarProfessoresAdmin() {
  const bimestre = bimestreAtual();

  const [listaProf, situacoes, listaDisc, listaTurmas] = await Promise.all([
    listarTodos('/professor'),
    api('/admin/professores'),
    listarTodos('/disciplina'),
    listarTodos('/turma'),
  ]);

  const situacaoPorId = new Map((situacoes ?? []).map((s) => [Number(s.id_professor), s.situacao]));

  const professores = listaProf.map((p) => {
    const idProf = Number(p.id_professor);
    const vinculos = p.vinculos ?? [];

    const turmasUnicas = new Map();
    vinculos.forEach((v) => {
      if (!turmasUnicas.has(Number(v.id_turma))) {
        turmasUnicas.set(Number(v.id_turma), { nome: v.turma, turno: v.turno || '' });
      }
    });
    const turmasDetalhes = Array.from(turmasUnicas.values());

    return {
      ...p,
      id: idProf,
      id_professor: idProf,
      disciplina: p.disciplina || 'Sem disciplina',
      turmas: turmasDetalhes.map((t) => t.nome).join(', ') || '–',
      turmasDetalhes,
      vinculos,
      horarios: p.horarios ?? [],
      situacao: situacaoPorId.get(idProf) ?? 'novo',
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

// Dados pessoais + vínculos (cada turma com a SUA disciplina) + horários.
// Disciplina nova é criada pelo backend, na mesma transação.
export async function atualizarProfessorAdmin(professorAtual, dados) {
  const idProf = Number(professorAtual.id_professor ?? professorAtual.id);
  return await api(`/professor/${idProf}`, {
    metodo: 'PUT',
    corpo: {
      nome: dados.nome,
      cpf: dados.cpf,
      telefone: dados.telefone || null, // antes "undefined": não dava para apagar o telefone
      email: dados.email,
      vinculos: dados.vinculos ?? [],
      horarios: Array.isArray(dados.horarios) ? dados.horarios : [],
    },
  });
}

// Passa uma turma/disciplina, com todas as notas, chamadas e tarefas, para
// outro professor. É o que permite excluir um professor que já deu aula.
export async function transferirVinculoProfessor(idProfessor, idTdp, idDestino) {
  return await api(`/professor/${idProfessor}/transferir`, {
    metodo: 'POST',
    corpo: { id_tdp: Number(idTdp), id_professor_destino: Number(idDestino) },
  });
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
