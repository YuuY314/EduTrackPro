'use client';

import { useState } from 'react';
import Agenda from '@/components/Agenda';
import { agenda } from '@/lib/dados';

const tipos = ['Letivo', 'Dia não letivo', 'Reunião de pais/responsáveis', 'Avaliação', 'Feriado'];

export default function Calendario() {
  const [eventos, setEventos] = useState(agenda);
  const [data, setData] = useState('2026-10-30');
  const [tipo, setTipo] = useState(tipos[0]);
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');

  function adicionar(evento) {
    evento.preventDefault();
    setEventos([...eventos, { data, tipo, descricao }]);
    setDescricao('');
    setMensagem('Data adicionada à agenda dos alunos');
  }

  return (
    <>
      <form className="cartao formulario" onSubmit={adicionar}>
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
          <button className="botao" type="submit">Adicionar ao calendário</button>{' '}
          <span className="mensagem" role="status">{mensagem}</span>
        </div>
      </form>

      <div className="cartao cartao-conteudo">
        <h3>Próximas datas</h3>
        <p className="dica">Esta lista aparece na Agenda da tela inicial dos alunos.</p>
        <Agenda eventos={eventos} />
      </div>
    </>
  );
}
