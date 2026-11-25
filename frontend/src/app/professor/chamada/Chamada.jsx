'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, lerSessao, listarTodos } from '@/src/lib/api';
import { hojeLocalISO } from '@/src/lib/utils';
import { rotuloAula } from '@/src/lib/grade';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function obterDiaSemana(dataStr) {
  if (!dataStr) return null;
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const dataObj = new Date(ano, mes - 1, dia);
  return DIAS_SEMANA[dataObj.getDay()];
}

export default function Chamada() {
  const SearchParams = useSearchParams();
  // ?tdp=ID do vínculo (turma+disciplina) e ?horario=ID do horário da grade.
  // ?turma= continua aceito, mas só como id da TURMA: antes ele era comparado
  // com o id da turma OU do vínculo, e "turma=1" podia abrir a disciplina errada.
  const tdpUrl = SearchParams.get('tdp');
  const turmaUrl = SearchParams.get('turma');
  const horarioUrl = SearchParams.get('horario');

  const [turmasProf, setTurmasProf] = useState([]);
  const [idTdpSelecionado, setIdTdpSelecionado] = useState('');
  // data local (toISOString usaria UTC e, depois das 21h, mostraria o dia seguinte)
  const [dataAula, setDataAula] = useState(() => hojeLocalISO());
  const [horariosTdp, setHorariosTdp] = useState([]);
  // id do horário da grade (horarios_aula.id): cada horário do dia tem a sua chamada
  const [aulaSelecionada, setAulaSelecionada] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [faltasIds, setFaltasIds] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  // se a chamada salva não carregou, NÃO deixa salvar: a tela mostraria todos
  // "Presente" e salvar apagaria as faltas já lançadas
  const [erroCarga, setErroCarga] = useState(false);
  const [horariosProntos, setHorariosProntos] = useState(false);

  // Ao trocar de turma, zera os horários antes de buscar os novos: antes o
  // horário da turma ANTERIOR ficava selecionado por um instante e a chamada
  // era buscada (ou salva) com o horário errado.
  function trocarTurma(idTdp) {
    setHorariosProntos(false);
    setHorariosTdp([]);
    setAulaSelecionada('');
    setIdTdpSelecionado(String(idTdp));
  }

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
          trocarTurma(escolhida.id_tdp || escolhida.id);
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
    if (!idTdpSelecionado) return;
    let ativo = true;

    api(`/frequencia/horarios/${idTdpSelecionado}`)
      .then((res) => {
        if (ativo) setHorariosTdp(res?.dados || []);
      })
      .catch((err) => {
        if (!ativo) return;
        setHorariosTdp([]);
        setMensagem(err.message || 'Erro ao carregar horários da turma.');
      })
      .finally(() => {
        if (ativo) setHorariosProntos(true);
      });

    return () => {
      ativo = false;
    };
  }, [idTdpSelecionado]);

  const turmaSelecionada = turmasProf.find((t) => String(t.id_tdp || t.id) === String(idTdpSelecionado));

  // Mesmo rótulo do cadastro de horários do admin (lib/grade.js):
  //   dia com aula na grade -> "2ª aula · 07:50–08:40 · Sala 3A"
  //   dia sem aula (reposição) -> "Segunda · 2ª aula · 07:50–08:40 · Sala 3A"
  // Antes: "1ª aula" contava só as aulas DESTE professor no dia (não a posição
  // na grade da turma) e, sem aula no dia, aparecia "Segunda 07:00".
  const opcoesAula = useMemo(() => {
    if (horariosTdp.length === 0) return [];
    const diaDaData = obterDiaSemana(dataAula);
    const doDia = horariosTdp.filter((h) => h.dia_semana === diaDaData);
    const listaBase = doDia.length > 0 ? doDia : horariosTdp;
    const turno = turmaSelecionada?.turno;

    return listaBase.map((h) => ({
      id: String(h.id),
      rotulo: rotuloAula({ ...h, turno }, { comDia: doDia.length === 0 }),
    }));
  }, [horariosTdp, dataAula, turmaSelecionada?.turno]);

  useEffect(() => {
    if (opcoesAula.length > 0) {
      const aindaExiste = opcoesAula.some((o) => o.id === aulaSelecionada);
      if (!aindaExiste) {
        const doLink = horarioUrl && opcoesAula.find((o) => o.id === String(horarioUrl));
        setAulaSelecionada(doLink ? doLink.id : opcoesAula[0].id);
      }
    } else {
      setAulaSelecionada('');
    }
  }, [opcoesAula, aulaSelecionada, horarioUrl]);

  // Carrega alunos + a chamada já salva daquele dia E daquele horário
  useEffect(() => {
    if (!idTdpSelecionado || !dataAula || !horariosProntos) return;
    // tem horário na grade, mas o select ainda não escolheu um: espera
    if (opcoesAula.length > 0 && !opcoesAula.some((o) => o.id === aulaSelecionada)) return;

    const turmaAtual = turmasProf.find((t) => String(t.id_tdp || t.id) === String(idTdpSelecionado));
    if (!turmaAtual) return;

    let ativo = true; // ignora respostas antigas se o professor trocar de turma/data/aula rápido
    setCarregando(true);
    setMensagem('');
    setErroCarga(false);

    const filtroHorario = aulaSelecionada ? `&id_horario=${aulaSelecionada}` : '';
    Promise.all([
      listarTodos(`/aluno?id_turma=${turmaAtual.id_turma}`),
      api(`/frequencia/chamada?id_tdp=${idTdpSelecionado}&data=${dataAula}${filtroHorario}`),
    ])
      .then(([listaAlunos, resChamada]) => {
        if (!ativo) return;
        setAlunos(listaAlunos);

        const chamadaExistente = resChamada?.dados;
        if (chamadaExistente?.aula) {
          const idsFaltosos = (chamadaExistente.frequencias || [])
            .filter((f) => Number(f.presente) === 0)
            .map((f) => f.id_aluno);
          setFaltasIds(idsFaltosos);
        } else {
          setFaltasIds([]);
        }
      })
      .catch((erro) => {
        if (!ativo) return;
        setErroCarga(true);
        setMensagem(erro.message || 'Erro ao carregar a chamada. Recarregue a página antes de salvar.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [idTdpSelecionado, dataAula, turmasProf, aulaSelecionada, horariosProntos, opcoesAula]);

  function alternar(idAluno) {
    setMensagem('');
    if (faltasIds.includes(idAluno)) {
      setFaltasIds(faltasIds.filter((id) => id !== idAluno));
    } else {
      setFaltasIds([...faltasIds, idAluno]);
    }
  }

  async function salvar() {
    if (!idTdpSelecionado || alunos.length === 0 || erroCarga) return;

    setSalvando(true);
    setMensagem('');

    try {
      const registros = alunos.map((aluno) => ({
        id_aluno: aluno.id_aluno,
        presente: faltasIds.includes(aluno.id_aluno) ? 0 : 1,
        justificativa: null,
      }));

      await api('/frequencia/chamada', {
        metodo: 'POST',
        corpo: {
          id_tdp: Number(idTdpSelecionado),
          id_horario: aulaSelecionada ? Number(aulaSelecionada) : null,
          data: dataAula,
          registros,
        },
      });

      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setMensagem(`Chamada salva às ${hora}`);
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao salvar chamada.');
    } finally {
      setSalvando(false);
    }
  }

  const presentes = alunos.length - faltasIds.length;

  return (
    <>
      <div className="filtros">
        <div className="campo largo">
          <label htmlFor="turma">Turma</label>
          <select 
            id="turma"
            value={idTdpSelecionado}
            onChange={(e) => trocarTurma(e.target.value)}
            disabled={turmasProf.length === 0}
          >
            {turmasProf.map((t) => {
              const idOpcao = t.id_tdp || t.id;
              const nomeTurma = t.turma || t.nome_turma || t.nome || 'Turma';
              const turnoTurma = t.turno || t.periodo || '';
              const disciplina = t.disciplina || t.nome_disciplina || '';
              return (
                <option key={idOpcao} value={idOpcao}>
                  {nomeTurma}
                  {turnoTurma ? ` · ${turnoTurma}` : ''}
                  {disciplina ? ` — ${disciplina}` : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="data">Data</label>
          <input id="data" type="date" value={dataAula} onChange={(e) => setDataAula(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="aula">Aula</label>
          <select id="aula" value={aulaSelecionada} onChange={(e) => setAulaSelecionada(e.target.value)} disabled={opcoesAula.length === 0}>
            {opcoesAula.length === 0 ? (
              <option value="">Sem horário cadastrado</option>
            ) : (
              opcoesAula.map((opcao) => (
                <option key={opcao.id} value={opcao.id}>
                  {opcao.rotulo}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="cartao">
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Aluno</th>
                <th className="centro">Situação</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="3">Carregando alunos...</td>
                </tr>
              ) : alunos.length === 0 ? (
                <tr>
                  <td colSpan="3">Nenhum aluno encontrado nesta turma.</td>
                </tr>
              ) : (
                alunos.map((aluno, i) => {
                  const faltou = faltasIds.includes(aluno.id_aluno);
                  return (
                    <tr key={aluno.id_aluno}>
                      <td>{String(i + 1).padStart(2, '0')}</td>
                      <td>{aluno.nome}</td>
                      <td className="centro">
                        <button
                          type="button"
                          className={`botao-presenca ${faltou ? 'falta' : ''}`}
                          onClick={() => alternar(aluno.id_aluno)}
                        >
                          {faltou ? 'Falta' : 'Presente'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="cartao-rodape">
          <span>
          <strong>{presentes}</strong> presentes · <strong>{faltasIds.length}</strong>{' '}
            {faltasIds.length === 1 ? 'falta' : 'faltas'}
          </span>
          <span className="mensagem" role="status">{mensagem}</span>
          <button type="button" className="botao" onClick={salvar} disabled={salvando || carregando || erroCarga || alunos.length === 0}>{salvando ? 'Salvando...' : 'Salvar chamada'}</button>
        </div>
      </div>
    </>
  );
}
