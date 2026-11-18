'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import CalendarioGrade from '@/src/components/CalendarioGrade';
import Selecao from '@/src/components/Selecao';
import SeletorData from '@/src/components/SeletorData';
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
          <SeletorData id="data-solicitacao" compacto obrigatorio value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="tipo-solicitacao">Tipo</label>
          <Selecao
            id="tipo-solicitacao"
            compacto
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            opcoes={tiposProfessor.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <div className="campo">
          <label htmlFor="turma-solicitacao">Turma</label>
          <Selecao
            id="turma-solicitacao"
            compacto
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
            opcoes={[
              { value: '', label: 'Todas as turmas' },
              ...turmas.map((t) => ({ value: t.nome, label: t.nome, detalhe: t.turno })),
            ]}
          />
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