'use client';

// =====================================================================
// SecaoHorarios - dia e horário de cada aula do professor
//
// Cada horário pertence a UMA linha da seção "Aulas" (turma + disciplina).
// Antes o horário guardava só as turmas: ao salvar, o backend escolhia a
// disciplina "no chute" e, para quem dá 2 matérias na mesma turma, as aulas
// trocavam de matéria. A sala também se perdia a cada salvamento.
//
// Os horários seguem a grade de lib/grade.js (a mesma da chamada). Horário
// já ocupado na turma por outro professor aparece bloqueado com o motivo.
// =====================================================================

import { useRef } from 'react';
import styles from './EditarAluno.module.css';
import extras from './SecaoHorarios.module.css';
import Selecao from './Selecao';
import { DIAS_SEMANA, fimPadrao, numeroParaDia, opcoesHorario, paraMinutos } from '@/src/lib/grade';

const completo = (h) => h.vinculo && h.dia && h.hora_inicio;
const sobrepoe = (a, b) =>
  paraMinutos(a.inicio) < paraMinutos(b.fim) && paraMinutos(b.inicio) < paraMinutos(a.fim);

// Converte as linhas da tela no formato da API (ProfessorService).
export function limparHorarios(lista = [], vinculos = []) {
  const porChave = new Map(vinculos.map((v) => [v._chave, v]));
  return lista
    .filter(completo)
    .filter((h) => porChave.has(h.vinculo))
    .map((h) => {
      const v = porChave.get(h.vinculo);
      return {
        id_turma: Number(v.id_turma),
        disciplina: v.disciplina,
        dia: h.dia,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
        sala: h.sala ?? null,
      };
    });
}

export default function SecaoHorarios({
  vinculos = [],
  turmas = [],
  value = [],
  onChange,
  ocupados = [],
  idProfessor,
  numero = '3',
}) {
  const proximaChave = useRef(0);

  const turmaPorId = new Map(turmas.map((t) => [String(t.id), t]));
  const validos = vinculos.filter((v) => v.id_turma && v.disciplina);
  const vinculoPorChave = new Map(validos.map((v) => [v._chave, v]));
  const turnoDe = (h) => turmaPorId.get(String(vinculoPorChave.get(h.vinculo)?.id_turma))?.turno;

  const opcoesAula = validos.map((v) => {
    const turma = turmaPorId.get(String(v.id_turma));
    return { value: v._chave, label: `${turma?.nome ?? 'Turma'} · ${v.disciplina}`, detalhe: turma?.turno };
  });

  // Aulas do próprio professor no mesmo dia e horário (mesmo em turmas diferentes)
  const repetidas = new Set();
  const preenchidas = value.filter(completo);
  preenchidas.forEach((a, i) => {
    preenchidas.slice(i + 1).forEach((b) => {
      const ia = { inicio: a.hora_inicio, fim: a.hora_fim || fimPadrao(turnoDe(a), a.hora_inicio) };
      const ib = { inicio: b.hora_inicio, fim: b.hora_fim || fimPadrao(turnoDe(b), b.hora_inicio) };
      if (a.dia === b.dia && sobrepoe(ia, ib)) {
        repetidas.add(a._chave);
        repetidas.add(b._chave);
      }
    });
  });

  // Quem já ocupa a turma naquele dia/horário (outros professores)
  function ocupante(idTurma, dia, inicio, fim) {
    const diaBanco = numeroParaDia(dia);
    return ocupados.find(
      (o) =>
        Number(o.id_professor) !== Number(idProfessor) &&
        String(o.id_turma) === String(idTurma) &&
        o.dia_semana === diaBanco &&
        sobrepoe({ inicio, fim }, { inicio: o.hora_inicio, fim: o.hora_fim })
    );
  }

  function alterar(chave, campo) {
    return (e) =>
      onChange(
        value.map((h) => {
          if (h._chave !== chave) return h;
          const novo = { ...h, [campo]: String(e.target.value) };
          if (campo === 'hora_inicio') novo.hora_fim = fimPadrao(turnoDe(novo), novo.hora_inicio);
          if (campo === 'vinculo') {
            // trocou para uma turma de outro turno: o horário antigo não vale mais
            const opcoes = opcoesHorario(turnoDe(novo)).map((o) => o.value);
            if (!opcoes.includes(novo.hora_inicio)) {
              novo.hora_inicio = '';
              novo.hora_fim = '';
            }
          }
          return novo;
        })
      );
  }

  function adicionar() {
    proximaChave.current += 1;
    const vinculoPadrao = opcoesAula.length === 1 ? opcoesAula[0].value : '';
    onChange([
      ...value,
      { _chave: `nh${proximaChave.current}`, vinculo: vinculoPadrao, dia: '', hora_inicio: '', hora_fim: '', sala: null },
    ]);
  }

  function remover(chave) {
    onChange(value.filter((h) => h._chave !== chave));
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

      {value.length > 0 && (
        <ul className={extras.linhas}>
          {value.map((h, i) => {
            const vinculo = vinculoPorChave.get(h.vinculo);
            const turno = turnoDe(h);
            const repetida = repetidas.has(h._chave);
            const opcoesHora = opcoesHorario(turno, [h.hora_inicio]).map((o) => {
              const quem =
                vinculo && h.dia && ocupante(vinculo.id_turma, h.dia, o.value, fimPadrao(turno, o.value));
              return quem
                ? { ...o, desabilitada: true, detalhe: `Ocupado: ${quem.disciplina} (${quem.professor})` }
                : o;
            });
            const conflito =
              vinculo && completo(h) && ocupante(vinculo.id_turma, h.dia, h.hora_inicio, h.hora_fim || fimPadrao(turno, h.hora_inicio));
            return (
              <li key={h._chave} className={extras.linha}>
                <div className={extras.campos}>
                  <Selecao
                    value={h.vinculo}
                    onChange={alterar(h._chave, 'vinculo')}
                    placeholder={opcoesAula.length ? 'Turma e disciplina' : 'Adicione uma turma em "Aulas"'}
                    erro={Boolean(h.vinculo) && !vinculo}
                    opcoes={opcoesAula}
                  />
                  <Selecao
                    value={h.dia}
                    onChange={alterar(h._chave, 'dia')}
                    placeholder="Dia da semana"
                    erro={repetida || Boolean(conflito)}
                    opcoes={DIAS_SEMANA}
                  />
                  <Selecao
                    value={h.hora_inicio}
                    onChange={alterar(h._chave, 'hora_inicio')}
                    placeholder="Horário"
                    erro={repetida || Boolean(conflito)}
                    opcoes={opcoesHora}
                  />
                  <button
                    type="button"
                    className={extras.remover}
                    onClick={() => remover(h._chave)}
                    aria-label={`Remover horário ${i + 1}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>
                {repetida && <span className={styles.erro}>O professor já tem outra aula neste dia e horário</span>}
                {conflito && (
                  <span className={styles.erro}>
                    Horário ocupado na turma: {conflito.disciplina} ({conflito.professor})
                  </span>
                )}
                {h.sala && <span className={extras.aviso}>Sala: {h.sala}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {value.length === 0 && <p className={extras.vazio}>Nenhum horário cadastrado.</p>}

      <button type="button" className={extras.adicionar} onClick={adicionar} disabled={opcoesAula.length === 0}>
        + Adicionar horário
      </button>
    </section>
  );
}

// Para o EditarProfessor saber, antes de enviar, se há algo a corrigir.
export function temProblemaNosHorarios(value, vinculos, turmas, ocupados, idProfessor) {
  const turmaPorId = new Map(turmas.map((t) => [String(t.id), t]));
  const porChave = new Map(vinculos.filter((v) => v.id_turma && v.disciplina).map((v) => [v._chave, v]));
  const linhas = value.filter((h) => h.vinculo || h.dia || h.hora_inicio);

  for (const h of linhas) {
    if (!completo(h) || !porChave.has(h.vinculo)) return 'Complete ou remova os horários incompletos.';
  }
  const comFaixa = linhas.map((h) => {
    const v = porChave.get(h.vinculo);
    const turno = turmaPorId.get(String(v.id_turma))?.turno;
    return { ...h, id_turma: v.id_turma, inicio: h.hora_inicio, fim: h.hora_fim || fimPadrao(turno, h.hora_inicio) };
  });
  for (let i = 0; i < comFaixa.length; i++) {
    for (let j = i + 1; j < comFaixa.length; j++) {
      if (comFaixa[i].dia === comFaixa[j].dia && sobrepoe(comFaixa[i], comFaixa[j])) {
        return 'Há duas aulas do professor no mesmo dia e horário.';
      }
    }
    const h = comFaixa[i];
    const choque = ocupados.find(
      (o) =>
        Number(o.id_professor) !== Number(idProfessor) &&
        String(o.id_turma) === String(h.id_turma) &&
        o.dia_semana === numeroParaDia(h.dia) &&
        sobrepoe(h, { inicio: o.hora_inicio, fim: o.hora_fim })
    );
    if (choque) return `Um dos horários já está ocupado na turma por ${choque.disciplina} (${choque.professor}).`;
  }
  return '';
}
