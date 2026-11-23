// Comunicação com o backend + sessão (token) guardada no navegador.

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
  const [resumoFaltas, resTarefas, resAvisos] = await Promise.all([
    api('/faltas_aluno/meu'),
    api('/tarefa'),
    api('/aviso'),
  ]);

  const listaTarefas = Array.isArray(resTarefas) ? resTarefas : (resTarefas?.dados ?? []);
  const listaAvisos = Array.isArray(resAvisos) ? resAvisos : (resAvisos?.dados ?? []);

  const totalPendencias = resTarefas?.paginacao?.total ?? listaTarefas.length;
  const totalAvisos = resAvisos?.paginacao?.total ?? listaAvisos.length;

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
    eventos: [...eventosAvisos, ...eventosTarefas],
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
//ele vai buscar cinco rotas diferentes da API ao mesmo tempo para retornar as informações do dashboard de uma só vez
export async function buscarDashboardProfessor() {

  //primeiro ele lê quem está logado para pegar o ID do professor e em seguida faz as chamadas de API em paralelo (tornando o carregamento mais rápido) 
  const sessao = lerSessao();
  const idProfessor = sessao?.usuario?.id_professor;

  const [resTurmas, resFaltas, resAlunos, resAulas] = await Promise.all([
    idProfessor
      ? api(`/turma_disciplina_professor/professor/${idProfessor}`).catch(() => ({ dados: [] }))
      : Promise.resolve({ dados: [] }),
    api('/faltas_aluno').catch(() => ({ dados: [] })),
    api('/aluno').catch(() => ({ dados: [] })),
    api('/aula').catch(() => ({ dados: [] })),
  ]);

  const listaTdp = Array.isArray(resTurmas) ? resTurmas : (resTurmas?.dados ?? []);
  const listaFaltas = Array.isArray(resFaltas) ? resFaltas : (resFaltas?.dados ?? []);
  const listaAlunos = Array.isArray(resAlunos) ? resAlunos : (resAlunos?.dados ?? []);
  const listaAulas = Array.isArray(resAulas) ? resAulas : (resAulas?.dados ?? []);

  //como o professor pode dar mais de uma materia para a mesma turma ele vai eliminar duplicações e criar uma lista de IDs pertencentes ao professor
  const turmasUnicas = Array.from(
    new Map(listaTdp.map((t) => [t.id_turma ?? t.id, t])).values()
  );
  const idsTdpProfessor = new Set(listaTdp.map((t) => Number(t.id_tdp ?? t.id)));
  const idsTurmasProfessor = new Set(turmasUnicas.map((t) => Number(t.id_turma ?? t.id)));
  const mapaAlunos = new Map(listaAlunos.map((a) => [Number(a.id_aluno ?? a.id), a]));

  const agora = new Date();
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const hojeIndice = agora.getDay();
  const hojeNome = diasSemana[hojeIndice].toLowerCase();
  const hojeISO = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, '0'),
    String(agora.getDate()).padStart(2, '0'),
  ].join('-');
  const mesAtual = agora.getMonth() + 1;
  const bimestreAtual = mesAtual <= 4 ? 1 : mesAtual <= 7 ? 2 : mesAtual <= 10 ? 3 : 4;

  //busca os horários fixos e as notas do bimestre atual direto por cada id_tdp do professor (sem corte de paginação)
  const bimestresTodos = [1, 2, 3, 4];

  //busca os horários fixos e as notas dos 4 bimestres direto por cada id_tdp do professor
  const [respostasHorarios, respostasTodosBimestres] = await Promise.all([
    Promise.all(
      listaTdp.map((t) => {
        const idTdp = t.id_tdp ?? t.id;
        return idTdp
          ? api(`/frequencia/horarios/${idTdp}`).catch(() => ({ dados: [] }))
          : Promise.resolve({ dados: [] });
      })
    ),
    Promise.all(
      listaTdp.flatMap((t) => {
        const idTdp = t.id_tdp ?? t.id;
        const idTurma = Number(t.id_turma ?? t.id);
        return bimestresTodos.map((bim) =>
          idTdp
            ? api(`/nota/boletim?id_tdp=${idTdp}&bimestre=${bim}`)
                .then((res) => ({ idTurma, bim, notas: res?.dados?.notas ?? [] }))
                .catch(() => ({ idTurma, bim, notas: [] }))
            : Promise.resolve({ idTurma, bim, notas: [] })
        );
      })
    ),
  ]);

  const listaHorarios = respostasHorarios.flatMap((r) =>
    Array.isArray(r) ? r : (r?.dados ?? [])
  );

  //descobre qual é o dia da semana de hoje pelo relógio do computador, mantendo os horários que pertencem ao professor e ordenando as aulas da mais cedo para a mais tarde
  const aulasHoje = listaHorarios
    .filter((h) => {
      const dia = String(h.dia_semana ?? h.dia ?? '').toLowerCase();
      return (
        dia.startsWith(hojeNome.slice(0, 3)) ||
        Number(h.dia_semana) === hojeIndice ||
        Number(h.dia_semana) === hojeIndice + 1
      );
    })
    .map((h, idx) => {
      const tdp = listaTdp.find((t) => Number(t.id_tdp ?? t.id) === Number(h.id_tdp)) || h;
      const inicio = String(h.hora_inicio ?? h.inicio ?? '').slice(0, 5);
      const fim = String(h.hora_fim ?? h.fim ?? '').slice(0, 5);
      const hora = inicio && fim ? `${inicio} - ${fim}` : inicio || `Aula ${idx + 1}`;
      const turmaNome = [tdp.turma || tdp.nome_turma, tdp.turno || tdp.periodo]
        .filter(Boolean)
        .join(' · ');
      const disciplinaNome = tdp.disciplina || tdp.nome_disciplina || 'Aula';

      return {
        id: h.id_horario ?? h.id ?? `${hora}-${idx}`,
        idTdp: Number(h.id_tdp),
        hora,
        turma: turmaNome || 'Turma',
        detalhe: disciplinaNome,
      };
    })
    .sort((a, b) => a.hora.localeCompare(b.hora));

  //inclui também chamadas registradas hoje na tabela aulas caso o professor tenha dado aula fora do horário fixo
  const tdpsJaNaLista = new Set(aulasHoje.map((a) => a.idTdp));
  listaAulas.forEach((a, idx) => {
    const idTdp = Number(a.id_tdp);
    const dataRegistro = a.data ? String(a.data).slice(0, 10) : '';
    if (!idsTdpProfessor.has(idTdp) || dataRegistro !== hojeISO || tdpsJaNaLista.has(idTdp)) {
      return;
    }
    tdpsJaNaLista.add(idTdp);
    const tdp = listaTdp.find((t) => Number(t.id_tdp ?? t.id) === idTdp) || {};
    const turmaNome = [tdp.turma || tdp.nome_turma, tdp.turno || tdp.periodo]
      .filter(Boolean)
      .join(' · ');
    const disciplinaNome = tdp.disciplina || tdp.nome_disciplina || 'Aula';

    aulasHoje.push({
      id: `aula-${a.id_aula ?? a.id ?? idx}`,
      idTdp,
      hora: a.conteudo || 'Chamada registrada',
      turma: turmaNome || 'Turma',
      detalhe: disciplinaNome,
    });
  });

  //filtra alunos com o percentual abaixo de 75% e ordenando de menor percentual ao maior (mais criticos no topo) 
  const alunosBaixaFrequencia = listaFaltas
    .filter((f) => {
      const alunoInfo = mapaAlunos.get(Number(f.id_aluno));
      const idTurma = f.id_turma ?? alunoInfo?.id_turma;

      const pertence =
        (f.id_professor && Number(f.id_professor) === Number(idProfessor)) ||
        (f.id_tdp && idsTdpProfessor.has(Number(f.id_tdp))) ||
        (idTurma && idsTurmasProfessor.has(Number(idTurma)));

      if (!pertence && (f.id_professor || f.id_tdp || idTurma)) return false;

      const freq = Number(f.frequencia ?? f.percentual_presenca ?? f.presenca_percentual ?? 100);
      return freq < 75;
    })
    .map((f, idx) => {
      const alunoInfo = mapaAlunos.get(Number(f.id_aluno));
      const freq = Math.round(
        Number(f.frequencia ?? f.percentual_presenca ?? f.presenca_percentual ?? 0)
      );
      return {
        id: f.id_aluno ?? f.id ?? idx,
        nome: f.aluno || f.nome_aluno || f.nome || alunoInfo?.nome || 'Aluno',
        detalhe: [
          f.turma || f.nome_turma || alunoInfo?.turma || alunoInfo?.nome_turma,
          f.turno || f.periodo || alunoInfo?.turno || alunoInfo?.periodo,
        ]
          .filter(Boolean)
          .join(' · '),
        frequencia: freq,
      };
    })
    .sort((a, b) => a.frequencia - b.frequencia);

  //Turmas que possuem pelo menos um bimestre (1º ao 4º) sem nenhuma nota lançada
  const turmasComPendencia = new Set();
  respostasTodosBimestres.forEach(({ idTurma, notas }) => {
    if (idTurma && notas.length === 0) {
      turmasComPendencia.add(idTurma);
    }
  });

  const turmasSemNota = turmasUnicas.filter((t) =>
    turmasComPendencia.has(Number(t.id_turma ?? t.id))
  ).length;

  const disciplinaPrincipal =
    listaTdp[0]?.disciplina || listaTdp[0]?.nome_disciplina || 'suas turmas';

  return {
    bimestreAtual,
    totalAulasHoje: aulasHoje.length,
    turmasSemNota,
    totalTurmas: turmasUnicas.length,
    totalBaixaFrequencia: alunosBaixaFrequencia.length,
    aulasHoje,
    alunosBaixaFrequencia,
    disciplinaPrincipal,
  };
}

// ==================== Administrador: Alunos ====================

//listar, cruzar as informações e formatalas para a tabelas de Alunos
export async function listarAlunosAdmin() {
  //disparando quatro requisições GET ao mesmo tempopara trazer todosos alunos cadastrados e suas respectivas turmas, turnos, dados cadastrais dos responsaveis e consulta as vw_faltas_alunos para obter o percentual de frequência (limit=100 para evitar cortes de página)
  const [resAlunos, resTurmas, resFaltas, resResponsaveis] = await Promise.all([
    api('/aluno?limite=100'),
    api('/turma?limite=100').catch(() => ({ dados: [] })),
    api('/faltas_aluno?limite=100').catch(() => ({ dados: [] })),
    api('/responsavel?limite=100').catch(() => ({ dados: [] })),
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
  const agora = new Date();
  const mesAtual = agora.getMonth() + 1;
  //se baseia no mês em que estamos para verificar as notas do bimestre
  const bimestreAtual = mesAtual <= 4 ? 1 : mesAtual <= 7 ? 2 : mesAtual <= 10 ? 3 : 4;

  //faz seis requisições ao mesmo tempo e garante que se ouver rota vazia ou falha a tela não quebra 
  const [resProf, resTdp, resDisc, resTurmas, resAval, resNotas] = await Promise.all([
    api('/professor?limite=100'),
    api('/turma_disciplina_professor?limite=100').catch(() => ({ turma_disciplina_professor: [] })),
    api('/disciplina?limite=100').catch(() => ({ dados: [] })),
    api('/turma?limite=100').catch(() => ({ turmas: [] })),
    api('/avaliacao?limite=100').catch(() => ({ dados: [] })),
    api('/nota?limite=100').catch(() => ({ dados: [] })),
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
        (a) => idsTdp.has(Number(a.id_tdp)) && Number(a.bimestre) === bimestreAtual
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

  return { professores, turmas, disciplinas, bimestreAtual };
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

  // Separa múltiplas disciplinas e múltiplas turmas (ex.: "História, Geografia" e "3A, 2B")
  const nomesDisciplinasAlvo = (dados.disciplina || '')
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n && n !== 'Sem disciplina');

  const nomesTurmasAlvo = (dados.turmas || '')
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n && n !== '–');

  if (nomesDisciplinasAlvo.length === 0 || nomesTurmasAlvo.length === 0) return;

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
        const resDiscAtualizada = await api('/disciplina?limite=100');
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

  const idsTurmasAlvo = new Set(
    turmasDisponiveis
      .filter((t) => nomesTurmasAlvo.includes(t.nome))
      .map((t) => Number(t.id_turma ?? t.id))
  );

  const vinculosAtuais = professorAtual.vinculos || [];

  // 1. Remove vínculos cuja disciplina ou turma foram desmarcadas
  for (const v of vinculosAtuais) {
    const discMantida = idsDisciplinasAlvo.has(Number(v.id_disciplina));
    const turmaMantida = idsTurmasAlvo.has(Number(v.id_turma));
    const idVinculo = v.id_tdp ?? v.id_turma_disciplina_professor ?? v.id;
    if ((!discMantida || !turmaMantida) && idVinculo) {
      await api(`/turma_disciplina_professor/${idVinculo}`, { metodo: 'DELETE' }).catch(() => null);
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
}

export async function excluirProfessorAdmin(idProfessor) {
  return await api(`/professor/${idProfessor}`, {
    metodo: 'DELETE',
  });
}

// ==================== Administrador: Turmas ====================
//chamadas simultâneas para fazer quatro requisições buscando os indicadores exigidos pela tabelada secretaria
export async function listarTurmasAdmin() {
  const [resTurmas, resAlunos, resDisc, resTdp] = await Promise.all([
    api('/turma?limite=100'),
    api('/aluno?limite=100').catch(() => ({ dados: [] })),
    api('/disciplina?limite=100').catch(() => ({ dados: [] })),
    api('/turma_disciplina_professor?limite=100').catch(() => ({ dados: [] })),
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