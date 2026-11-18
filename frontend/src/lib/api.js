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
