'use client';

// =====================================================================
// SecaoVinculos - "quem dá qual matéria em qual turma" no editar professor
//
// Cada linha é UM par turma + disciplina (igual à tabela
// turma_disciplina_professor). Antes a tela tinha dois campos soltos,
// "Disciplinas" e "Turmas", e o backend cruzava tudo com tudo: um
// professor de Matemática no 3A e Física no 3B ganhava também Física no
// 3A e Matemática no 3B.
//
// A disciplina que já tem outro professor naquela turma aparece
// bloqueada, com o nome de quem dá a aula, em vez de deixar salvar e
// receber um erro depois.
// =====================================================================

import { useRef, useState } from 'react';
import styles from './EditarAluno.module.css';
import extras from './SecaoHorarios.module.css';
import Selecao from './Selecao';

export const chaveOcupacao = (idTurma, disciplina) => `${idTurma}|${String(disciplina).trim().toLowerCase()}`;

const completo = (v) => v.id_turma && v.disciplina;

export default function SecaoVinculos({
  turmas = [],
  disciplinas = [],
  value = [],
  onChange,
  ocupacao = new Map(),
  idProfessor,
  horariosPorVinculo = {},
  professores = [],
  onTransferir,
  erro,
  numero = '2',
}) {
  const proximaChave = useRef(0);
  // linha com a caixa "Transferir para..." aberta, destino escolhido e envio em andamento
  const [transferindo, setTransferindo] = useState(null);
  const [destino, setDestino] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroTransferencia, setErroTransferencia] = useState('');

  function abrirTransferencia(chave) {
    setTransferindo((atual) => (atual === chave ? null : chave));
    setDestino('');
    setErroTransferencia('');
  }

  async function confirmarTransferencia(v) {
    const novo = professores.find((p) => String(p.id) === String(destino));
    if (!novo) {
      setErroTransferencia('Escolha o professor que vai receber a turma.');
      return;
    }
    const turma = turmas.find((t) => String(t.id) === String(v.id_turma))?.nome ?? 'turma';
    const aviso =
      `Transferir ${v.disciplina} da turma ${turma} para ${novo.nome}?\n\n` +
      'As notas, chamadas, tarefas e horários continuam e passam a aparecer para o novo professor. ' +
      'Isto é salvo na hora, sem precisar clicar em "Salvar alterações".';
    if (!window.confirm(aviso)) return;

    setEnviando(true);
    setErroTransferencia('');
    try {
      await onTransferir(v, novo.id);
      setTransferindo(null);
    } catch (e) {
      setErroTransferencia(e.message || 'Não foi possível transferir.');
    } finally {
      setEnviando(false);
    }
  }

  const repetidas = new Set();
  const vistos = new Set();
  value.filter(completo).forEach((v) => {
    const chave = chaveOcupacao(v.id_turma, v.disciplina);
    if (vistos.has(chave)) repetidas.add(v._chave);
    vistos.add(chave);
  });

  function alterar(chave, campo) {
    return (e) => onChange(value.map((v) => (v._chave === chave ? { ...v, [campo]: String(e.target.value) } : v)));
  }

  function adicionar() {
    proximaChave.current += 1;
    const turmaPadrao = turmas.length === 1 ? String(turmas[0].id) : '';
    onChange([...value, { _chave: `nv${proximaChave.current}`, id_turma: turmaPadrao, disciplina: '' }]);
  }

  function remover(chave) {
    onChange(value.filter((v) => v._chave !== chave));
  }

  return (
    <section className={`${styles.secao} ${styles.atraso}`}>
      <div className={styles.secaoTitulo}>
        <span className={styles.numero}>{numero}</span>
        <div>
          <h3>Aulas</h3>
          <p>Escolha a disciplina que o professor dá em cada turma</p>
        </div>
      </div>

      {value.length > 0 && (
        <ul className={extras.linhas}>
          {value.map((v, i) => {
            const opcoesDisciplina = disciplinas.map((nome) => {
              const dono = ocupacao.get(chaveOcupacao(v.id_turma, nome));
              const deOutro = v.id_turma && dono && Number(dono.id_professor) !== Number(idProfessor);
              return {
                value: nome,
                label: nome,
                detalhe: deOutro ? dono.professor : undefined,
                desabilitada: Boolean(deOutro),
              };
            });
            const qtdHorarios = horariosPorVinculo[v._chave] ?? 0;
            const turmaDaLinha = turmas.find((t) => String(t.id) === String(v.id_turma));
            return (
              <li key={v._chave} className={extras.linha}>
                {v.em_uso ? (
                  // Linha com notas/chamadas: mostrada como texto fixo com cadeado
                  // (trocar a turma ou a disciplina apagaria ou misturaria o histórico)
                  <div className={extras.camposVinculo}>
                    <div className={extras.fixo}>
                      <span>{turmaDaLinha?.nome ?? 'Turma'}</span>
                      {turmaDaLinha?.turno && <span className={extras.selo}>{turmaDaLinha.turno}</span>}
                    </div>
                    <div className={extras.fixo}>
                      <span>{v.disciplina}</span>
                    </div>
                    <span
                      className={extras.cadeado}
                      role="img"
                      aria-label="Travada: já tem notas lançadas"
                      title="Já tem notas lançadas"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                  </div>
                ) : (
                  <div className={extras.camposVinculo}>
                    <Selecao
                      value={v.id_turma}
                      onChange={alterar(v._chave, 'id_turma')}
                      placeholder="Turma"
                      erro={!v.id_turma && Boolean(erro)}
                      opcoes={turmas.map((t) => ({ value: String(t.id), label: t.nome, detalhe: t.turno }))}
                    />
                    <Selecao
                      value={v.disciplina}
                      onChange={alterar(v._chave, 'disciplina')}
                      placeholder="Disciplina"
                      erro={repetidas.has(v._chave) || (!v.disciplina && Boolean(erro))}
                      opcoes={opcoesDisciplina}
                    />
                    <button
                      type="button"
                      className={extras.remover}
                      onClick={() => remover(v._chave)}
                      aria-label={`Remover aula ${i + 1}${qtdHorarios ? ` e os ${qtdHorarios} horários dela` : ''}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                      </svg>
                    </button>
                  </div>
                )}
                {repetidas.has(v._chave) && <span className={styles.erro}>Esta turma e disciplina já estão na lista</span>}
                {v.em_uso && (
                  <span className={extras.aviso}>
                    Já tem notas lançadas. Para mudar, adicione uma nova linha ou use “Transferir”.
                  </span>
                )}
                {v.id_tdp && onTransferir && (
                  <button type="button" className={extras.linkAcao} onClick={() => abrirTransferencia(v._chave)}>
                    {transferindo === v._chave ? 'Cancelar transferência' : 'Transferir para outro professor'}
                  </button>
                )}
                {transferindo === v._chave && (
                  <div className={extras.transferir}>
                    <Selecao
                      value={destino}
                      onChange={(e) => setDestino(String(e.target.value))}
                      placeholder="Novo professor"
                      opcoes={professores
                        .filter((p) => Number(p.id) !== Number(idProfessor))
                        .map((p) => ({ value: String(p.id), label: p.nome, detalhe: p.disciplina }))}
                    />
                    <button
                      type="button"
                      className={styles.btnPrimario}
                      onClick={() => confirmarTransferencia(v)}
                      disabled={enviando}
                    >
                      {enviando ? 'Transferindo...' : 'Transferir'}
                    </button>
                    {erroTransferencia && <span className={styles.erro}>{erroTransferencia}</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {value.length === 0 && <p className={extras.vazio}>Nenhuma turma atribuída.</p>}
      {erro && <span className={styles.erro}>{erro}</span>}

      <button type="button" className={extras.adicionar} onClick={adicionar}>
        + Adicionar turma e disciplina
      </button>
    </section>
  );
}
