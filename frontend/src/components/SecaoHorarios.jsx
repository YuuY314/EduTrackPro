'use client';

import { useRef } from 'react';
import styles from './EditarAluno.module.css';
import extras from './SecaoHorarios.module.css';
import Selecao from './Selecao';

const DIAS = [
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

const TURNOS = {
  'Manhã': { inicio: '07:00', aulas: 6 },
  'Tarde': { inicio: '13:00', aulas: 6 },
  'Noite': { inicio: '19:00', aulas: 5 },
};

const DURACAO = 50;

function somarMinutos(hora, minutos) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function horariosDoTurno(turno) {
  const lista = turno && TURNOS[turno] ? [[turno, TURNOS[turno]]] : Object.entries(TURNOS);
  return lista.flatMap(([nome, { inicio, aulas }]) =>
    Array.from({ length: aulas }, (_, i) => {
      const comeca = somarMinutos(inicio, i * DURACAO);
      return {
        value: comeca,
        label: turno ? `${i + 1}ª aula` : `${nome} · ${i + 1}ª aula`,
        detalhe: `${comeca} – ${somarMinutos(comeca, DURACAO)}`,
      };
    })
  );
}

function normalizarTurma(t) {
  if (typeof t !== 'object' || t === null) return { value: String(t), label: String(t) };
  const value = String(t.id ?? t.id_turma ?? t.nome);
  return { value, label: t.nome ?? value, detalhe: t.turno, turno: t.turno };
}

const turmasDe = (h) => (Array.isArray(h.turmas) ? h.turmas : h.turma ? [h.turma] : []).map(String);
const completo = (h) => turmasDe(h).length && h.dia && h.hora;
const chaveAula = (h) => `${h.dia}-${h.hora}`;

export function limparHorarios(lista = []) {
  const vistos = new Set();
  return lista
    .filter(completo)
    .filter((h) => {
      const chave = chaveAula(h);
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .map((h) => ({ turmas: turmasDe(h), dia: h.dia, hora: h.hora }))
    .sort((a, b) => a.dia.localeCompare(b.dia) || a.hora.localeCompare(b.hora));
}

export default function SecaoHorarios({ turmas = [], selecionadas, value = [], onChange, numero = '3' }) {
  const proximaChave = useRef(value.length);
  const todas = turmas.map(normalizarTurma);
  const ids = selecionadas?.map(String);
  const opcoesTurma = ids?.length ? todas.filter((t) => ids.includes(t.value)) : todas;

  const linhas = value.map((h, i) => ({ ...h, turmas: turmasDe(h), _chave: h._chave ?? `h${i}` }));

  const repetidas = new Set();
  const contagem = {};
  linhas.filter(completo).forEach((h) => {
    const chave = chaveAula(h);
    contagem[chave] = (contagem[chave] ?? 0) + 1;
    if (contagem[chave] > 1) repetidas.add(h._chave);
  });

  function atualizar(lista) {
    onChange(lista);
  }

  function alterar(chave, campo) {
    return (e) =>
      atualizar(
        linhas.map((h) => {
          if (h._chave !== chave) return h;
          const novo = { ...h, [campo]: e.target.value };
          if (campo === 'turmas') {
            delete novo.turma;
            const turnos = new Set(todas.filter((t) => novo.turmas.includes(t.value)).map((t) => t.turno));
            const opcoes = horariosDoTurno(turnos.size === 1 ? [...turnos][0] : undefined).map((o) => o.value);
            if (!opcoes.includes(novo.hora)) novo.hora = '';
          }
          return novo;
        })
      );
  }

  function adicionar() {
    proximaChave.current += 1;
    const turmasPadrao = opcoesTurma.length === 1 ? [opcoesTurma[0].value] : [];
    atualizar([...linhas, { _chave: `n${proximaChave.current}`, turmas: turmasPadrao, dia: '', hora: '' }]);
  }

  function remover(chave) {
    atualizar(linhas.filter((h) => h._chave !== chave));
  }

  return (
    <section className={`${styles.secao} ${styles.atraso}`}>
      <div className={styles.secaoTitulo}>
        <span className={styles.numero}>{numero}</span>
        <div>
          <h3>Horários</h3>
          <p>Dia da semana e horário de cada aula</p>
        </div>
      </div>

      {linhas.length > 0 && (
        <ul className={extras.linhas}>
            {linhas.map((h, i) => {
              const turnos = new Set(todas.filter((t) => h.turmas.includes(t.value)).map((t) => t.turno));
              const turnoUnico = turnos.size === 1 ? [...turnos][0] : undefined;
              const repetida = repetidas.has(h._chave);
              return (
                <li key={h._chave} className={extras.linha}>
                  <div className={extras.campos}>
                    <Selecao
                      multiplo
                      value={h.turmas}
                      onChange={alterar(h._chave, 'turmas')}
                      placeholder="Selecione as turmas"
                      opcoes={opcoesTurma.map(({ value, label, detalhe }) => ({ value, label, detalhe }))}
                    />
                    <Selecao
                      value={h.dia}
                      onChange={alterar(h._chave, 'dia')}
                      placeholder="Dia da semana"
                      erro={repetida}
                      opcoes={DIAS}
                    />
                    <Selecao
                      value={h.hora}
                      onChange={alterar(h._chave, 'hora')}
                      placeholder="Horário"
                      erro={repetida}
                      opcoes={horariosDoTurno(turnoUnico)}
                    />
                    <button
                      type="button"
                      className={extras.remover}
                      onClick={() => remover(h._chave)}
                      aria-label={`Remover aula ${i + 1}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                      </svg>
                    </button>
                  </div>
                  {repetida && <span className={styles.erro}>Já existe uma aula neste dia e horário</span>}
                </li>
              );
            })}
        </ul>
      )}

      {linhas.length === 0 && <p className={extras.vazio}>Nenhum horário cadastrado.</p>}

      <button type="button" className={extras.adicionar} onClick={adicionar}>
        + Adicionar horário
      </button>
    </section>
  );
}