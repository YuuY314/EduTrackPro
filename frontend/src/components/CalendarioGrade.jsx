'use client';

import { useEffect, useState } from 'react';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Classe de cor de cada tipo de evento
const CLASSE_TIPO = {
  'Letivo': 'letivo',
  'Dia não letivo': 'nao-letivo',
  'Reunião de pais/responsáveis': 'reuniao',
  'Avaliação': 'avaliacao',
  'Feriado': 'feriado',
};

// Monta 'AAAA-MM-DD' sem passar por UTC (evita o bug do dia anterior)
function chaveData(data) {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

export default function CalendarioGrade({ eventos, pendentes = [], selecionada, onSelecionar }) {
  const [ano, setAno] = useState(() => Number(selecionada.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(selecionada.slice(5, 7)) - 1);

  // Se a data mudar pelo input, a grade pula para o mês dela
  useEffect(() => {
    if (!selecionada) return;
    setAno(Number(selecionada.slice(0, 4)));
    setMes(Number(selecionada.slice(5, 7)) - 1);
  }, [selecionada]);

  const hoje = chaveData(new Date());

  // Agrupa eventos confirmados e pendentes por data
  const eventosPorData = {};
  for (const ev of eventos) {
    (eventosPorData[ev.data] ??= []).push(ev);
  }
  for (const ev of pendentes) {
    (eventosPorData[ev.data] ??= []).push({ ...ev, pendente: true });
  }

  // 6 semanas fixas, começando no domingo antes do dia 1
  const primeiroDia = new Date(ano, mes, 1);
  const celulas = Array.from(
    { length: 42 },
    (_, i) => new Date(ano, mes, 1 - primeiroDia.getDay() + i)
  );

  function mudarMes(delta) {
    const novo = new Date(ano, mes + delta, 1);
    setAno(novo.getFullYear());
    setMes(novo.getMonth());
  }

  return (
    <div className="cal-grade">
      <div className="cal-cabecalho">
        <strong>{MESES[mes]} de {ano}</strong>
        <div className="cal-navegacao">
          <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</button>
          <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês">›</button>
        </div>
      </div>

      <div className="cal-semana">
        {DIAS_SEMANA.map((d, i) => <span key={i}>{d}</span>)}
      </div>

      <div className="cal-dias">
        {celulas.map((dia) => {
          const chave = chaveData(dia);
          const eventosDia = eventosPorData[chave] ?? [];
          const classes = [
            'cal-dia',
            dia.getMonth() !== mes && 'fora-do-mes',
            chave === hoje && 'hoje',
            chave === selecionada && 'selecionado',
          ].filter(Boolean).join(' ');

          const titulo = eventosDia
            .map((e) => `${e.pendente ? '(pendente) ' : ''}${e.descricao || e.tipo}`)
            .join('\n');

          return (
            <button
              key={chave}
              type="button"
              className={classes}
              onClick={() => onSelecionar(chave)}
              title={titulo || undefined}
              aria-pressed={chave === selecionada}
            >
              {dia.getDate()}
              {eventosDia.length > 0 && (
                <span className="cal-marcadores">
                  {eventosDia.slice(0, 3).map((ev, i) => (
                    <i
                      key={i}
                      className={`cal-ponto ${ev.pendente ? 'pendente' : CLASSE_TIPO[ev.tipo] ?? ''}`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ul className="cal-legenda">
        {Object.entries(CLASSE_TIPO).map(([tipo, classe]) => (
          <li key={tipo}><i className={`cal-ponto ${classe}`} /> {tipo}</li>
        ))}
        <li><i className="cal-ponto pendente" /> Pendente</li>
      </ul>
    </div>
  );
}