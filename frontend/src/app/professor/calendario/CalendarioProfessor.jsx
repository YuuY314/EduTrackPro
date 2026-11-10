'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import CalendarioGrade from '@/src/components/CalendarioGrade';
import { perfis, turmas } from '@/src/lib/dados';
import { useCalendario, formatarData, hojeISO } from '@/src/lib/calendario';

const tiposProfessor = ['Avaliação', 'Reunião de pais/responsáveis', 'Dia não letivo'];

const STATUS = {
  pendente: { cor: 'atencao', texto: 'Pendente' },
  confirmada: { cor: 'bom', texto: 'Confirmada' },
  recusada: { cor: 'ruim', texto: 'Recusada' },
};

const professor = perfis.professor.nomeCompleto;

export default function CalendarioProfessor() {
  const { eventos, solicitacoes, solicitar, cancelarSolicitacao } = useCalendario();

  const [data, setData] = useState(hojeISO);
  const [tipo, setTipo] = useState(tiposProfessor[0]);
  const [turma, setTurma] = useState('');
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');

  const minhas = solicitacoes
    .filter((s) => s.professor === professor)
    .sort((a, b) => a.data.localeCompare(b.data));

  const minhasPendentes = minhas.filter((s) => s.status === 'pendente');

  function enviar(evento) {
    evento.preventDefault();
    solicitar({ data, tipo, turma, descricao: descricao.trim(), professor });
    setDescricao('');
    setMensagem('Solicitação enviada para a administração');
  }

  function cancelar(s) {
    const { diaMes } = formatarData(s.data);
    if (!window.confirm(`Cancelar a solicitação de ${s.tipo} em ${diaMes}?`)) return;
    cancelarSolicitacao(s.id);
    setMensagem('Solicitação cancelada');
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
          <select id="turma-solicitacao" value={turma} onChange={(e) => setTurma(e.target.value)}>
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.nome}>{t.nome} · {t.turno}</option>
            ))}
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
          <button className="botao" type="submit">Enviar solicitação</button>{' '}
          <span className="mensagem" role="status">{mensagem}</span>
        </div>
      </form>

      <div className="calendario-layout">
        <div className="cartao cartao-conteudo">
          <h3>Mês</h3>
          <p className="dica">Clique em um dia para escolher a data.</p>
          <CalendarioGrade eventos={eventos} pendentes={minhasPendentes} selecionada={data} onSelecionar={setData} />
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Minhas solicitações</h3>
          <p className="dica">A administração confirma ou recusa cada pedido.</p>

          {minhas.length === 0 && <p className="dica">Você ainda não enviou nenhuma solicitação.</p>}

          {minhas.map((s) => {
            const { diaMes, semana } = formatarData(s.data);
            const status = STATUS[s.status];
            return (
              <div key={s.id} className="evento com-acoes">
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
          })}
        </div>
      </div>
    </>
  );
}