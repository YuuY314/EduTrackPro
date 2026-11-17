'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { alunosDaTurma, turmas } from '@/src/lib/api';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function obterDiaSemana(dataStr) {
  if (!dataStr) return null;
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const dataObj = new Date(ano, mes - 1, dia);
  return DIAS_SEMANA[dataObj.getDay()];
}

export default function Chamada() {
  const SearchParams = useSearchParams();
  const turmaUrl = SearchParams.get('turma');

  const [turmasProf, setTurmasProf] = useState([]);
  const [idTdpSelecionado, setIdTdpSelecionado] = useState('');
  const [dataAula, setDataAula] = useState(() => new Date().toISOString().split('T')[0]);
  const [horariosTdp, setHorariosTdp] = useState([]);
  const [aulaSelecionada, setAulaSelecionada] = useState('');

  const [alunos, setAlunos] = useState([]);
  const [faltasIds, setFaltasIds] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

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
          const encontrada = turmaUrl
            ? lista.find((t) => String(t.id_turma) === String(turmaUrl) || String(t.id_tdp) === String(turmaUrl))
            : null;
          setIdTdpSelecionado(String((encontrada || lista[0]).id_tdp));
        } else {
          setCarregando(false);
        }
      })
      .catch(() => {
        setMensagem('Erro ao carregar turmas do professor.');
        setCarregando(false);
      });
  }, [turmaUrl]);

  useEffect(() => {
    if (!idTdpSelecionado || !dataAula) return;

    const turmaAtual = turmasProf.find((t) => String(t.id_tdp) === String(idTdpSelecionado));
    if (!turmaAtual) return;

    setCarregando(true);
    setMensagem('');

    Promise.all([
      api(`/alunos?id_turma=${turmaAtual.id_turma}&limite=100`),
      api(`/frequencias/chamada?id_tdp=${idTdpSelecionado}&data=${dataAula}`).catch(() => ({ dados: null })),
    ])
      .then(([resAlunos, resChamada]) => {
        const listaAlunos = resAlunos?.dados || [];
        setAlunos(listaAlunos);

        const chamadaExistente = resChamada?.dados;
        if (chamadaExistente?.aula) {
          setConteudoAula(chamadaExistente.aula.conteudo || '');
          const idsFaltosos = (chamadaExistente.frequencias || [])
            .filter((f) => Number(f.presente) === 0)
            .map((f) => f.id_aluno);
          setFaltasIds(idsFaltosos);
        } else {
          setConteudoAula('');
          setFaltasIds([]);
        }
      })
      .catch(() => {
        setMensagem('Erro ao carregar lista de alunos.');
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [idTdpSelecionado, dataAula, turmasProf]);

  function alternar(idAluno) {
    setMensagem('');
    if (faltas.includes(idAluno)) {
      setFaltasIds(faltas.filter((id) => id !== idAluno));
    } else {
      setFaltasIds([...faltasIds, idAluno]);
    }
  }

  async function salvar() {
    if (!idTdpSelecionado || alunos.length === 0) return;

    setSalvando(true);
    setMensagem('');

    try {
      const registros = alunos.map((aluno) => ({
        id_aluno: aluno.id_aluno,
        presente: faltasIds.includes(aluno.id_aluno) ? 0 : 1,
        justificativa: null,
      }));

      await api('/frequencias/chamada', {
        method: 'POST',
        body: {
          id_tdp: Number(idTdpSelecionado),
          data: dataAula,
          conteudo: conteudoAula.trim() || null,
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
            onChange={(e) => setIdTdpSelecionado(e.target.value)}
            disabled={turmasProf.length === 0}
          >
            {turmasProf.map((t) => (
              <option key={t.id_tdp} value={t.id_tdp}>{t.turma} · {t.turno}</option>
            ))}
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
                <option key={opcao.id} value={opcao.rotulo}>
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
              {alunosDaTurma.map((aluno, i) => {
                const faltou = faltas.includes(aluno);
                return (
                  <tr key={aluno}>
                    <td>{String(i + 1).padStart(2, '0')}</td>
                    <td>{aluno}</td>
                    <td className="centro">
                      <button
                        className={`botao-presenca ${faltou ? 'falta' : ''}`}
                        onClick={() => alternar(aluno)}
                      >
                        {faltou ? 'Falta' : 'Presente'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="cartao-rodape">
          <span>
            <strong>{presentes}</strong> presentes · <strong>{faltas.length}</strong>{' '}
            {faltas.length === 1 ? 'falta' : 'faltas'}
          </span>
          <span className="mensagem" role="status">{mensagem}</span>
          <button className="botao" onClick={salvar}>Salvar chamada</button>
        </div>
      </div>
    </>
  );
}
