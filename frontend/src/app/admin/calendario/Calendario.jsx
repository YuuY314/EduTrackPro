'use client';

import { useEffect, useState } from 'react';
import CalendarioGrade from '@/src/components/CalendarioGrade';
import Etiqueta from '@/src/components/Etiqueta';
import Selecao from '@/src/components/Selecao';
import SeletorData from '@/src/components/SeletorData';
import { admin, api } from '@/src/lib/api';
import { formatarData, hojeISO } from '@/src/lib/calendario';

const tipos = ['Letivo', 'Dia não letivo', 'Reunião de pais/responsáveis', 'Avaliação', 'Feriado'];

//normaliza o que vem de GET /api/calendario (data sempre AAAA-MM-DD e status em minúsculo)
function normalizarEventos(res) {
  const lista = Array.isArray(res) ? res : res?.dados || [];
  return lista.map((e) => ({
    ...e,
    id: e.id_evento ?? e.id,
    data: e.data ? String(e.data).slice(0, 10) : '',
    status: String(e.status || 'confirmada').toLowerCase(),
  }));
}

//linha de detalhe do evento: turma · descrição · professor que pediu
function detalheEvento(ev) {
  return [
    ev.id_turma ? ev.turma : ev.id_professor ? 'Todas as turmas' : '',
    ev.descricao,
    ev.professor ? `Prof. ${ev.professor}` : '',
  ].filter(Boolean).join(' · ');
}

export default function Calendario() {
  //lista completa vinda do banco (confirmados, pendentes e recusados)
  const [todosEventos, setTodosEventos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  //campos do formulário (o mesmo formulário serve para criar e para editar)
  const [data, setData] = useState(hojeISO);
  const [tipo, setTipo] = useState(tipos[0]);
  const [idTurma, setIdTurma] = useState('');
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  //recusa: qual solicitação está com o campo de motivo aberto e o texto digitado
  const [recusandoId, setRecusandoId] = useState(null);
  const [motivo, setMotivo] = useState('');

  async function carregarCalendario() {
    const res = await api('/calendario');
    setTodosEventos(normalizarEventos(res));
  }

  useEffect(() => {
    Promise.all([
      api('/calendario'),
      admin.turmas().catch(() => []),
    ])
      .then(([resEventos, listaTurmas]) => {
        setTodosEventos(normalizarEventos(resEventos));
        setTurmas(listaTurmas);
      })
      .catch(() => setMensagem('Erro ao carregar dados do calendário.'))
      .finally(() => setCarregando(false));
  }, []);

  const confirmados = todosEventos
    .filter((e) => e.status === 'confirmada')
    .sort((a, b) => a.data.localeCompare(b.data));

  const pendentes = todosEventos
    .filter((e) => e.status === 'pendente')
    .sort((a, b) => a.data.localeCompare(b.data));

  const recusadas = todosEventos
    .filter((e) => e.status === 'recusada')
    .sort((a, b) => a.data.localeCompare(b.data));

  function limparFormulario() {
    setEditandoId(null);
    setTipo(tipos[0]);
    setIdTurma('');
    setDescricao('');
  }

  //POST para criar (admin cria já "confirmada") ou PUT para salvar a edição
  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem('');

    const corpo = {
      data,
      tipo,
      id_turma: idTurma ? Number(idTurma) : null,
      descricao: descricao.trim(),
    };

    try {
      if (editandoId) {
        await api(`/calendario/${editandoId}`, { metodo: 'PUT', corpo });
        setMensagem('Evento atualizado');
      } else {
        await api('/calendario', { metodo: 'POST', corpo: { ...corpo, status: 'confirmada' } });
        setMensagem('Data adicionada à agenda dos alunos');
      }
      await carregarCalendario();
      limparFormulario();
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao salvar evento.');
    } finally {
      setSalvando(false);
    }
  }

  function editar(ev) {
    setEditandoId(ev.id);
    setData(ev.data);
    setTipo(tipos.includes(ev.tipo) ? ev.tipo : tipos[0]);
    setIdTurma(ev.id_turma ? String(ev.id_turma) : '');
    setDescricao(ev.descricao ?? '');
    setMensagem('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluir(ev) {
    const { diaMes } = formatarData(ev.data);
    if (!window.confirm(`Excluir "${ev.tipo}" de ${diaMes}?`)) return;

    setMensagem('');
    try {
      await api(`/calendario/${ev.id}`, { metodo: 'DELETE' });
      if (editandoId === ev.id) limparFormulario();
      await carregarCalendario();
      setMensagem('Evento excluído');
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao excluir evento.');
    }
  }

  //aprovar = mudar o status da solicitação para "confirmada" (ela passa a aparecer no calendário)
  async function aprovar(s) {
    setMensagem('');
    try {
      await api(`/calendario/${s.id}`, { metodo: 'PUT', corpo: { status: 'confirmada', motivo: null } });
      await carregarCalendario();
      setMensagem('Solicitação aprovada');
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao aprovar solicitação.');
    }
  }

  //abre o campo de motivo embaixo da solicitação
  function abrirRecusa(s) {
    setRecusandoId(s.id);
    setMotivo('');
    setMensagem('');
  }

  function fecharRecusa() {
    setRecusandoId(null);
    setMotivo('');
  }

  //recusar = status "recusada" + motivo (o professor vê o motivo na tela dele)
  async function recusar(evento, s) {
    evento.preventDefault();
    setMensagem('');
    try {
      await api(`/calendario/${s.id}`, { metodo: 'PUT', corpo: { status: 'recusada', motivo: motivo.trim() } });
      if (editandoId === s.id) limparFormulario();
      fecharRecusa();
      await carregarCalendario();
      setMensagem('Solicitação recusada');
    } catch (erro) {
      setMensagem(erro.message || 'Erro ao recusar solicitação.');
    }
  }

  function linhaEvento(ev, acoes, extra = null) {
    const { diaMes, semana } = formatarData(ev.data);
    const detalhe = detalheEvento(ev);
    return (
      <div key={ev.id} className={`evento com-acoes${ev.id === editandoId ? ' editando' : ''}`}>
        <time dateTime={ev.data}>
          {diaMes}
          <small>{semana}</small>
        </time>
        <div>
          <strong>{ev.tipo}</strong>
          {detalhe && <p>{detalhe}</p>}
          {ev.status === 'recusada' && <p>Motivo: {ev.motivo || 'não informado'}</p>}
        </div>
        <div className="evento-acoes">{acoes}</div>
        {extra}
      </div>
    );
  }

  return (
    <>
      <form className="cartao formulario" onSubmit={salvar}>
        <div className="campo">
          <label htmlFor="data-evento">Data</label>
          <SeletorData id="data-evento" compacto obrigatorio value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="tipo-evento">Tipo</label>
          <Selecao
            id="tipo-evento"
            compacto
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            opcoes={tipos.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <div className="campo">
          <label htmlFor="turma-evento">Turma</label>
          <Selecao
            id="turma-evento"
            compacto
            value={idTurma}
            onChange={(e) => setIdTurma(e.target.value)}
            opcoes={[
              { value: '', label: 'Todas as turmas' },
              ...turmas.map((t) => ({ value: String(t.id), label: t.nome, detalhe: t.turno })),
            ]}
          />
        </div>
        <div className="campo">
          <label htmlFor="descricao-evento">Descrição</label>
          <input
            id="descricao-evento"
            placeholder="Opcional"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <div>
          <button className="botao" type="submit" disabled={salvando || carregando}>
            {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar ao calendário'}
          </button>{' '}
          {editandoId && (
            <button className="botao botao-contorno" type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}{' '}
          <span className="mensagem" role="status">{mensagem}</span>
        </div>
      </form>

      <div className="cartao cartao-conteudo solicitacoes-admin">
        <h3>Solicitações dos professores</h3>
        <p className="dica">Ao aprovar, a data entra no calendário. Ao recusar, o professor vê o motivo.</p>

        {carregando ? (
          <p className="dica">Carregando solicitações...</p>
        ) : pendentes.length === 0 ? (
          <p className="dica">Nenhuma solicitação pendente.</p>
        ) : (
          pendentes.map((s) => linhaEvento(s, (
            <>
              <Etiqueta cor="atencao">Pendente</Etiqueta>
              <button type="button" className="botao botao-pequeno" onClick={() => aprovar(s)}>
                Aprovar
              </button>
              <button type="button" className="botao botao-contorno botao-pequeno" onClick={() => editar(s)}>
                Editar
              </button>
              <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => abrirRecusa(s)}>
                Recusar
              </button>
            </>
          ), recusandoId === s.id && (
            <form className="recusa-motivo" onSubmit={(e) => recusar(e, s)}>
              <label htmlFor={`motivo-${s.id}`}>Motivo da recusa</label>
              <input
                id={`motivo-${s.id}`}
                autoFocus
                placeholder="Ex.: data já tem outra avaliação"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              <button type="submit" className="botao botao-perigo botao-pequeno">
                Confirmar recusa
              </button>
              <button type="button" className="botao botao-contorno botao-pequeno" onClick={fecharRecusa}>
                Cancelar
              </button>
            </form>
          )))
        )}

        {recusadas.length > 0 && (
          <>
            <h3 className="recusadas-titulo">Recusadas</h3>
            {recusadas.map((s) => linhaEvento(s, (
              <>
                <Etiqueta cor="ruim">Recusada</Etiqueta>
                <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => excluir(s)}>
                  Excluir
                </button>
              </>
            )))}
          </>
        )}
      </div>

      <div className="calendario-layout">
        <div className="cartao cartao-conteudo">
          <h3>Mês</h3>
          <p className="dica">Clique em um dia para escolher a data do evento.</p>
          <CalendarioGrade eventos={confirmados} pendentes={pendentes} selecionada={data} onSelecionar={setData} />
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Próximas datas</h3>
          <p className="dica">Esta lista aparece na Agenda da tela inicial dos alunos.</p>

          {carregando ? (
            <p className="dica">Carregando eventos...</p>
          ) : confirmados.length === 0 ? (
            <p className="dica">Nenhuma data cadastrada.</p>
          ) : (
            confirmados.map((ev) => linhaEvento(ev, (
              <>
                <button type="button" className="botao botao-contorno botao-pequeno" onClick={() => editar(ev)}>
                  Editar
                </button>
                <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => excluir(ev)}>
                  Excluir
                </button>
              </>
            )))
          )}
        </div>
      </div>
    </>
  );
}
