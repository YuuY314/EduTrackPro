import { useEffect, useState } from 'react';
import { agenda } from './dados';

const CHAVE = 'edutrackpro-calendario';
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];


export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatarData(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return {
    diaMes: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
    semana: DIAS_CURTOS[data.getDay()],
  };
}


function novoId(prefixo) {
  return `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function estadoInicial() {
  return {
    eventos: agenda.map((ev, i) => ({ id: `ev-inicial-${i}`, ...ev })),
    solicitacoes: [],
  };
}

function ler() {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo) return JSON.parse(salvo);
  } catch {}
  return estadoInicial();
}

function gravar(estado) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {}
}

export function useCalendario() {
  const [estado, setEstado] = useState(estadoInicial);

  useEffect(() => {
    setEstado(ler());

    function aoMudar(evento) {
      if (evento.key === CHAVE) setEstado(ler());
    }
    window.addEventListener('storage', aoMudar);
    return () => window.removeEventListener('storage', aoMudar);
  }, []);

  function atualizar(alterar) {
    setEstado((atual) => {
      const novo = alterar(atual);
      gravar(novo);
      return novo;
    });
  }

  return {
    eventos: estado.eventos,
    solicitacoes: estado.solicitacoes,

    adicionarEvento: (dados) =>
      atualizar((e) => ({ ...e, eventos: [...e.eventos, { id: novoId('ev'), ...dados }] })),

    editarEvento: (id, dados) =>
      atualizar((e) => ({ ...e, eventos: e.eventos.map((ev) => (ev.id === id ? { ...ev, ...dados } : ev)) })),

    excluirEvento: (id) =>
      atualizar((e) => ({ ...e, eventos: e.eventos.filter((ev) => ev.id !== id) })),

    solicitar: (dados) =>
      atualizar((e) => ({
        ...e,
        solicitacoes: [...e.solicitacoes, { id: novoId('sol'), status: 'pendente', motivo: '', ...dados }],
      })),

    cancelarSolicitacao: (id) =>
      atualizar((e) => ({ ...e, solicitacoes: e.solicitacoes.filter((s) => s.id !== id) })),

    confirmarSolicitacao: (id) =>
      atualizar((e) => {
        const s = e.solicitacoes.find((x) => x.id === id);
        if (!s) return e;
        const detalhe = [s.turma, s.descricao].filter(Boolean).join(' – ');
        return {
          eventos: [
            ...e.eventos,
            {
              id: novoId('ev'),
              data: s.data,
              tipo: s.tipo,
              descricao: detalhe ? `${detalhe} (Prof. ${s.professor})` : `Prof. ${s.professor}`,
            },
          ],
          solicitacoes: e.solicitacoes.map((x) => (x.id === id ? { ...x, status: 'confirmada' } : x)),
        };
      }),

    recusarSolicitacao: (id, motivo) =>
      atualizar((e) => ({
        ...e,
        solicitacoes: e.solicitacoes.map((x) => (x.id === id ? { ...x, status: 'recusada', motivo } : x)),
      })),
  };
}