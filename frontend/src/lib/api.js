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

// Faz a requisição para a rota da API que busca o resumo e os detalhes de faltas do aluno logado
export async function buscarMinhaPresenca() {
  return await api('/faltas_aluno/meu/detalhado');
}


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