'use client';

import { useEffect, useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import CalendarioGrade from '@/src/components/CalendarioGrade';
import { api, lerSessao } from '@/src/lib/api';
import { formatarData, hojeISO } from '@/src/lib/calendario';

const tiposProfessor = ['Avaliação', 'Reunião de pais/responsáveis', 'Dia não letivo'];

const STATUS = {
  pendente: { cor: 'atencao', texto: 'Pendente' },
  confirmada: { cor: 'bom', texto: 'Confirmada' },
  recusada: { cor: 'ruim', texto: 'Recusada' },
};

export default function CalendarioProfessor() {

  //guarda o ID do professor para registrar quem fez a solicitação e filtrar a quem pertence;
  //também guarda a lista retornada por GET /api/calendario (de onde vêm os dias pintados e solicitações)
  const [idProfessor, setIdProfessor] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [todosEventos, setTodosEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  //estados dos campos do formulário: data, tipo selecionado, ID numérico da turma (ou vazio para "Todas as turmas"), descrição e mensagem
  const [data, setData] = useState(hojeISO);
  const [tipo, setTipo] = useState(tiposProfessor[0]);
  const [idTurma, setIdTurma] = useState('');
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');

  //noramalizar os dados que vem do banco de dados
  function normalizarEventos(res) {
    const lista = Array.isArray(res) ? res : res?.dados || [];
    return lista.map((e) => ({
      ...e,
      data: e.data ? String(e.data).slice(0, 10) : '',
      status: String(e.status || 'pendente').toLowerCase(),
    }));
  }

  //função auxiliar que chama GET /api/calendario e atualiza todosEventos quando algo é criado ou excluído
  async function carregarCalendario() {
    const res = await api('/calendario');
    setTodosEventos(normalizarEventos(res));
  }

  useEffect(() => {
    const sessao = lerSessao();
    const profId = sessao?.usuario?.id_professor ?? null;
    setIdProfessor(profId);

    Promise.all([
      api('/calendario'),
      profId
        ? api(`/turma_disciplina_professor/professor/${profId}`).catch(() => ({ dados: [] }))
        : api('/turma').catch(() => ({ dados: [] })),
    ])
      .then(([resEventos, resTurmas]) => {
        setTodosEventos(normalizarEventos(resEventos));

        const listaTurmas = Array.isArray(resTurmas) ? resTurmas : resTurmas?.dados || [];
        //remove turmas duplicadas caso venham de turma_disciplina_professor
        const turmasUnicas = Array.from(
          new Map(listaTurmas.map((t) => [t.id_turma ?? t.id, t])).values()
        );
        setTurmas(turmasUnicas);
      })
      .catch(() => {
        setMensagem('Erro ao carregar dados do calendário.');
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  //todos os eventos com o estado confirmado
  const eventosConfirmados = todosEventos.filter((e) => e.status === 'confirmada');

  //filtra as solicitações feitas pelo professor logado e ordena por data
  const minhas = todosEventos
    .filter((s) => idProfessor && Number(s.id_professor) === Number(idProfessor))
    .sort((a, b) => a.data.localeCompare(b.data));

  //filtra as que ainda estão pendentes
  const minhasPendentes = minhas.filter((s) => s.status === 'pendente');

  async function enviar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem('');

    try {
      await api('/calendario', {
        metodo: 'POST',
        corpo: {
          id_professor: idProfessor,
          id_turma: idTurma ? Number(idTurma) : null,
          data,
          tipo,
          descricao: descricao.trim(),
        },
      });

      await carregarCalendario();
      setDescricao('');
      setMensagem('Solicitação enviada para a administração');
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao enviar solicitação.');
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar(s) {
    const { diaMes } = formatarData(s.data);
    if (!window.confirm(`Cancelar a solicitação de ${s.tipo} em ${diaMes}?`)) return;

    setMensagem('');
    try {
      await api(`/calendario/${s.id_evento ?? s.id}`, { metodo: 'DELETE' });
      await carregarCalendario();
      setMensagem('Solicitação cancelada');
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao cancelar solicitação.');
    }
  }

  return (
    <>
      <form className="cartao formulario" onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="data-solicitacao">Data</label>
          <input id="data-solicitacao" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="tipo-solicitacao">Tipo</label>
          <select id="tipo-solicitacao" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {tiposProfessor.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="turma-solicitacao">Turma</label>
          <select id="turma-solicitacao" value={idTurma} onChange={(e) => setIdTurma(e.target.value)}>
            <option value="">Todas as turmas</option>
            {turmas.map((t) => {
              const valorId = t.id_turma ?? t.id;
              const nome = t.turma || t.nome_turma || t.nome;
              const turno = t.turno || t.periodo || '';
              return (
                <option key={valorId} value={valorId}>
                  {nome}{turno ? ` · ${turno}` : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="descricao-solicitacao">Descrição</label>
          <input
            id="descricao-solicitacao"
            placeholder="Ex.: Prova de funções"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <div>
          <button className="botao" type="submit" disabled={salvando || carregando}>
            {salvando ? 'Enviando...' : 'Enviar solicitação'}
          </button>{' '}
          <span className="mensagem" role="status">{mensagem}</span>
        </div>
      </form>

      <div className="calendario-layout">
        <div className="cartao cartao-conteudo">
          <h3>Mês</h3>
          <p className="dica">Clique em um dia para escolher a data.</p>
          <CalendarioGrade eventos={eventosConfirmados} pendentes={minhasPendentes} selecionada={data} onSelecionar={setData} />
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Minhas solicitações</h3>
          <p className="dica">A administração confirma ou recusa cada pedido.</p>

          {carregando ? (
            <p className="dica">Carregando solicitações...</p>
          ) : minhas.length === 0 ? (
            <p className="dica">Você ainda não enviou nenhuma solicitação.</p>
          ) : (
            minhas.map((s) => {
              const { diaMes, semana } = formatarData(s.data);
              const chaveStatus = String(s.status || 'pendente').toLowerCase();
              const status = STATUS[chaveStatus] || { cor: 'atencao', texto: s.status || 'Pendente' };
              return (
                <div key={s.id_evento ?? s.id} className="evento com-acoes">
                  <time dateTime={s.data}>
                    {diaMes}
                    <small>{semana}</small>
                  </time>
                  <div>
                    <strong>{s.tipo}</strong>
                    <p>{[s.turma || 'Todas as turmas', s.descricao].filter(Boolean).join(' · ')}</p>
                    {s.status === 'recusada' && s.motivo && <p>Motivo: {s.motivo}</p>}
                  </div>
                  <div className="evento-acoes">
                    <Etiqueta cor={status.cor}>{status.texto}</Etiqueta>
                    {s.status === 'pendente' && (
                      <button type="button" className="botao botao-contorno botao-pequeno" onClick={() => cancelar(s)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}