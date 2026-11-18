// Comunicação com o backend + sessão (token) guardada no navegador.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const CHAVE_SESSAO = 'edutrackpro:sessao';

// fetch que já manda o token e transforma { erro } da API em exceção.
export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const sessao = lerSessao();
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(sessao && { Authorization: `Bearer ${sessao.token}` }),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  // Mandamos um token e o backend respondeu 401: o token venceu, foi
  // adulterado ou a conta foi apagada. Equivale ao session_destroy() do PHP.
  if (resposta.status === 401 && sessao) {
    sessaoExpirou();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível falar com o servidor.');
  return dados;
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

//ele vai buscar cinco rotas diferentes da API ao mesmo tempo para retornar as informações do dasboard de uma só vez
export async function buscarDashboardProfessor() {

  //primeiro ele lê quem está logado para pegar o ID do professor e em seguida fas as chamadas de API em paralelo (tornando o carregamento mais rápido) 
  const sessao = lerSessao();
  const idProfessor = sessao?.usuario?.id_professor;

  const [resTurmas, resHorarios, resFaltas, resBoletim, resAlunos] = await Promise.all([
    idProfessor
      ? api(`/turma_disciplina_professor/professor/${idProfessor}`).catch(() => ({ dados: [] }))
      : Promise.resolve({ dados: [] }),
    api('/horario_aula').catch(() => ({ dados: [] })),
    api('/faltas_aluno').catch(() => ({ dados: [] })),
    api('/boletim').catch(() => ({ dados: [] })),
    api('/aluno').catch(() => ({ dados: [] })),
  ]);

  const listaTdp = Array.isArray(resTurmas) ? resTurmas : (resTurmas?.dados ?? []);
  const listaHorarios = Array.isArray(resHorarios) ? resHorarios : (resHorarios?.dados ?? []);
  const listaFaltas = Array.isArray(resFaltas) ? resFaltas : (resFaltas?.dados ?? []);
  const listaBoletim = Array.isArray(resBoletim) ? resBoletim : (resBoletim?.dados ?? []);
  const listaAlunos = Array.isArray(resAlunos) ? resAlunos : (resAlunos?.dados ?? []);

  //como o professor pode dar mais de uma materia para a mesma turma ele vai eliminar duplicações e criar uma lista de IDs pertencentes ao professor
  const turmasUnicas = Array.from(
    new Map(listaTdp.map((t) => [t.id_turma ?? t.id, t])).values()
  );
  const idsTdpProfessor = new Set(listaTdp.map((t) => Number(t.id_tdp ?? t.id)));
  const idsTurmasProfessor = new Set(turmasUnicas.map((t) => Number(t.id_turma ?? t.id)));
  const disciplinasProfessor = new Set(
    listaTdp.map((t) => String(t.disciplina || t.nome_disciplina || '').toLowerCase()).filter(Boolean)
  );
  const mapaAlunos = new Map(listaAlunos.map((a) => [Number(a.id_aluno ?? a.id), a]));

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const hojeIndice = new Date().getDay();
  const hojeNome = diasSemana[hojeIndice].toLowerCase();

  //descobre qual é o dia da semana de hoje pelo relógio do computador, mantendo os horários que pertencem ao professor e ordenando as aulas da masi cedo para a mais tarde
  const aulasHoje = listaHorarios
    .filter((h) => {
      const pertenceProfessor =
        (h.id_professor && Number(h.id_professor) === Number(idProfessor)) ||
        (h.id_tdp && idsTdpProfessor.has(Number(h.id_tdp)));

      if (!pertenceProfessor) return false;

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
        hora,
        turma: turmaNome || 'Turma',
        detalhe: disciplinaNome,
      };
    })
    .sort((a, b) => a.hora.localeCompare(b.hora));

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

  //Turmas sem nota lançada no bimestre atual (calculado pela data de hoje)
  const mesAtual = new Date().getMonth() + 1;
  const bimestreAtual = mesAtual <= 4 ? 1 : mesAtual <= 7 ? 2 : mesAtual <= 10 ? 3 : 4;

  const turmasComNotaNoBimestre = new Set();
  listaBoletim.forEach((b) => {
    if (Number(b.bimestre) !== bimestreAtual || (b.nota == null && b.media == null)) return;
    if (
      disciplinasProfessor.size > 0 &&
      b.disciplina &&
      !disciplinasProfessor.has(String(b.disciplina).toLowerCase())
    ) {
      return;
    }
    const alunoInfo = mapaAlunos.get(Number(b.id_aluno));
    const idTurma = b.id_turma ?? alunoInfo?.id_turma;
    if (idTurma) {
      turmasComNotaNoBimestre.add(Number(idTurma));
    }
  });

  const turmasSemNota = turmasUnicas.filter(
    (t) => !turmasComNotaNoBimestre.has(Number(t.id_turma ?? t.id))
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