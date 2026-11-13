'use client';

import { useState } from 'react';
import { agenda } from '@/src/lib/dados';
import CalendarioGrade from './CalendarioGrade';

const tipos = ['Letivo', 'Dia não letivo', 'Reunião de pais/responsáveis', 'Avaliação', 'Feriado'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

let proximoId = 1;
const novoId = () => `ev-${proximoId++}`;

function formatar(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return {
    diaMes: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
    semana: DIAS_CURTOS[data.getDay()],
  };
}

export default function Calendario() {
  const [eventos, setEventos] = useState(() => agenda.map((ev) => ({ id: novoId(), ...ev })));
  const [data, setData] = useState('2026-10-30');
  const [tipo, setTipo] = useState(tipos[0]);
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  function limparFormulario() {
    setEditandoId(null);
    setTipo(tipos[0]);
    setDescricao('');
  }

  function salvar(evento) {
    evento.preventDefault();

    if (editandoId) {
      setEventos(eventos.map((ev) =>
        ev.id === editandoId ? { ...ev, data, tipo, descricao } : ev
      ));
      setMensagem('Evento atualizado');
    } else {
      setEventos([...eventos, { id: novoId(), data, tipo, descricao }]);
      setMensagem('Data adicionada à agenda dos alunos');
    }

    limparFormulario();
  }

  function editar(ev) {
    setEditandoId(ev.id);
    setData(ev.data);
    setTipo(ev.tipo);
    setDescricao(ev.descricao ?? '');
    setMensagem('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function excluir(ev) {
    const { diaMes } = formatar(ev.data);
    if (!window.confirm(`Excluir "${ev.tipo}" de ${diaMes}?`)) return;

    setEventos(eventos.filter((e) => e.id !== ev.id));
    if (editandoId === ev.id) limparFormulario();
    setMensagem('Evento excluído');
  }

  const ordenados = [...eventos].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <>
      <form className="cartao formulario" onSubmit={salvar}>
        <div className="campo">
          <label htmlFor="data-evento">Data</label>
          <input id="data-evento" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="tipo-evento">Tipo</label>
          <select id="tipo-evento" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {tipos.map((t) => <option key={t}>{t}</option>)}
          </select>
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
          <button className="botao" type="submit">
            {editandoId ? 'Salvar alterações' : 'Adicionar ao calendário'}
          </button>{' '}
          {editandoId && (
            <button className="botao botao-contorno" type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}{' '}
          <span className="mensagem" role="status">{mensagem}</span>
        </div>
      </form>

      <div className="calendario-layout">
        <div className="cartao cartao-conteudo">
          <h3>Mês</h3>
          <p className="dica">Clique em um dia para escolher a data do evento.</p>
          <CalendarioGrade eventos={eventos} selecionada={data} onSelecionar={setData} />
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Próximas datas</h3>
          <p className="dica">Esta lista aparece na Agenda da tela inicial dos alunos.</p>

          {ordenados.length === 0 && <p className="dica">Nenhuma data cadastrada.</p>}

          {ordenados.map((ev) => {
            const { diaMes, semana } = formatar(ev.data);
            return (
              <div key={ev.id} className={`evento com-acoes${ev.id === editandoId ? ' editando' : ''}`}>
                <time dateTime={ev.data}>
                  {diaMes}
                  <small>{semana}</small>
                </time>
                <div>
                  <strong>{ev.tipo}</strong>
                  {ev.descricao && <p>{ev.descricao}</p>}
                </div>
                <div className="evento-acoes">
                  <button type="button" className="botao botao-contorno botao-pequeno" onClick={() => editar(ev)}>
                    Editar
                  </button>
                  <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => excluir(ev)}>
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}