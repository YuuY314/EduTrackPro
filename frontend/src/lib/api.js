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

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível falar com o servidor.');
  return dados;
}

export async function login({ login, senha, perfil, lembrar }) {
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

export function sair() {
  localStorage.removeItem(CHAVE_SESSAO);
  sessionStorage.removeItem(CHAVE_SESSAO);
}
