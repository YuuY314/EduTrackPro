'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Etiqueta from '@/src/components/Etiqueta';
import { api, lerSessao, listarTodos } from '@/src/lib/api';
import { bimestreAtual, corDaNota, media, PESOS_AVALIACOES } from '@/src/lib/utils';

const avaliacoes = ['Prova 1', 'Prova 2', 'Trabalho'];

export default function Notas() {
  const searchParams = useSearchParams();
  // ?tdp=ID do vínculo (turma+disciplina); ?turma= só como id da turma (ver Chamada.jsx)
  const tdpUrl = searchParams.get('tdp');
  const turmaUrl = searchParams.get('turma');

  const [turmasProf, setTurmasProf] = useState([]);
  const [idTdpSelecionado, setIdTdpSelecionado] = useState('');
  // const [bimestre, setBimestre] = useState('3');

  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  // abre no bimestre atual. Antes a lista "padrão" só tinha o 3º e o 4º:
  // no 1º e no 2º bimestre a tela abria no 3º sem avisar.
  const [bimestre, setBimestre] = useState(() => String(bimestreAtual()));
  // se as notas salvas não carregaram, NÃO deixa salvar: a tela mostraria tudo
  // em branco e "Salvar" apagaria as notas já lançadas
  const [erroCarga, setErroCarga] = useState(false);

  useEffect(() => {
    const sessao = lerSessao();
    const idProfessor = sessao?.usuario?.id_professor;

    if (!idProfessor) {
      setCarregando(false);
      return;
    }

    api(`/turma_disciplina_professor/professor/${idProfessor}`)
      .then((res) => {
        const lista = res?.dados || [];
        setTurmasProf(lista);

        if (lista.length > 0) {
          const encontrada =
            (tdpUrl && lista.find((t) => String(t.id_tdp) === String(tdpUrl))) ||
            (turmaUrl && lista.find((t) => String(t.id_turma) === String(turmaUrl))) ||
            null;
          const escolhida = encontrada || lista[0];
          setIdTdpSelecionado(String(escolhida.id_tdp || escolhida.id));
        } else {
          setCarregando(false);
        }
      })
      .catch(() => {
        setMensagem('Erro ao carregar turmas do professor.');
        setCarregando(false);
      });
  }, [tdpUrl, turmaUrl]);

  useEffect(() => {
    if (!idTdpSelecionado || !bimestre) return;

    const turmaAtual = turmasProf.find(
      (t) => String(t.id_tdp || t.id) === String(idTdpSelecionado)
    );
    if (!turmaAtual) return;

    let ativo = true; // ignora respostas antigas se trocar de turma/bimestre rápido
    setCarregando(true);
    setMensagem('');
    setErroCarga(false);

    Promise.all([
      listarTodos(`/aluno?id_turma=${turmaAtual.id_turma}`),
      api(`/nota/boletim?id_tdp=${idTdpSelecionado}&bimestre=${bimestre}`),
    ])
      .then(([listaAlunos, resBoletim]) => {
        if (!ativo) return;
        const avalsBanco = resBoletim?.dados?.avaliacoes || [];
        const notasBanco = resBoletim?.dados?.notas || [];

        // Mapeia id_avaliacao para o índice 0, 1 ou 2 ('Prova 1', 'Prova 2', 'Trabalho')
        const indicePorIdAval = new Map();
        avalsBanco.forEach((a) => {
          const idx = avaliacoes.indexOf(a.titulo);
          if (idx !== -1) indicePorIdAval.set(a.id_avaliacao, idx);
        });

        const linhasMontadas = listaAlunos.map((aluno) => {
          const notasAluno = ['', '', ''];
          notasBanco
            .filter((n) => Number(n.id_aluno) === Number(aluno.id_aluno))
            .forEach((n) => {
              const idx = indicePorIdAval.get(n.id_avaliacao);
              if (idx !== undefined) {
                notasAluno[idx] = String(n.valor);
              }
            });

          return {
            id_aluno: aluno.id_aluno,
            aluno: aluno.nome,
            notas: notasAluno,
          };
        });

        setLinhas(linhasMontadas);
      })
      .catch((erro) => {
        if (!ativo) return;
        setErroCarga(true);
        setMensagem(erro.message || 'Erro ao carregar alunos e notas. Recarregue a página antes de salvar.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [idTdpSelecionado, bimestre, turmasProf]);

  function mudarNota(indiceAluno, indiceNota, valor) {
    if (valor !== '' && (Number(valor) < 0 || Number(valor) > 10)) {
      setMensagem('A nota deve estar entre 0 e 10.');
      return;
    }
    const novas = [...linhas];
    novas[indiceAluno] = { ...novas[indiceAluno], notas: [...novas[indiceAluno].notas] };
    novas[indiceAluno].notas[indiceNota] = valor;
    setLinhas(novas);
    setMensagem('');
  }

  async function salvar() {
    if (!idTdpSelecionado || linhas.length === 0 || erroCarga) return;

    setSalvando(true);
    setMensagem('');

    try {
      const registros = linhas.map((l) => ({
        id_aluno: l.id_aluno,
        notas: l.notas,
      }));

      await api('/nota/boletim', {
        metodo: 'POST',
        corpo: {
          id_tdp: Number(idTdpSelecionado),
          bimestre: Number(bimestre),
          titulos: avaliacoes,
          registros,
        },
      });

      const emBranco = linhas.filter((l) => media(l.notas, PESOS_AVALIACOES) === null).length;
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setMensagem(
        emBranco
          ? `Notas salvas às ${hora} · ${emBranco} aluno(s) com nota em branco`
          : `Notas salvas às ${hora}`
      );
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao salvar notas.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="filtros">
        <div className="campo largo">
          <label htmlFor="turma">Turma</label>
          <select 
          id="turma"
          value={idTdpSelecionado}
          onChange={(e) => setIdTdpSelecionado(e.target.value)}
          disabled={turmasProf.length === 0}
          >
            {turmasProf.map((t) => {
              const idOpcao = t.id_tdp || t.id;
              const nomeTurma = t.turma || t.nome_turma || t.nome || 'Turma';
              const turnoTurma = t.turno || t.periodo || '';
              const materia = t.disciplina || t.nome_disciplina || '';
              return (
                <option key={idOpcao} value={idOpcao}>
                  {nomeTurma}{turnoTurma ? ` · ${turnoTurma}` : ''}{materia ? ` — ${materia}` : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="bimestre">Bimestre</label>
          <select id="bimestre" value={bimestre} onChange={(e) => setBimestre(e.target.value)}>
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
          </select>
        </div>
      </div>

      <div className="cartao">
        <div className="tabela-rolagem tabela-larga">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                {avaliacoes.map((a) => <th key={a} className="centro">{a}</th>)}
                <th className="centro">Média</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={avaliacoes.length + 2}>Carregando alunos e notas...</td>
                </tr>
              ) : linhas.length === 0 ? (
                <tr>
                  <td colSpan={avaliacoes.length + 2}>Nenhum aluno encontrado nesta turma.</td>
                </tr>
              ) : (
                linhas.map((linha, i) => {
                  const m = media(linha.notas, PESOS_AVALIACOES);
                  return (
                    <tr key={linha.id_aluno}>
                      <td>{linha.aluno}</td>
                      {linha.notas.map((nota, j) => (
                        <td key={j} className="centro">
                          <input
                            className="campo-nota"
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={nota}
                            aria-label={`${linha.aluno} – ${avaliacoes[j]}`}
                            onKeyDown={(e) => {
                              if (['e', 'E', '+', '-'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => mudarNota(i, j, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="centro">
                        <Etiqueta cor={corDaNota(m)}>{m === null ? '–' : m.toFixed(1)}</Etiqueta>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="cartao-rodape">
          <span className="dica">Média = Prova 1 × 40% + Prova 2 × 30% + Trabalho × 30%</span>
          <span className="mensagem" role="status">{mensagem}</span>
          <button type="button" className="botao" onClick={salvar} disabled={salvando || carregando || erroCarga || linhas.length === 0}>{salvando ? 'Salvando...' : 'Salvar notas'}</button>
        </div>
      </div>
    </>
  );
}
