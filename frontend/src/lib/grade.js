// =====================================================================
// lib/grade.js - a grade de horários da escola (UM lugar só)
//
// Antes cada tela tinha a sua versão: o cadastro de horários do admin
// gerava 6 aulas seguidas (07:00, 07:50, 08:40, 09:30, 10:20...) sem
// intervalo, enquanto o banco (cronograma do 3A) usa 5 aulas com intervalo
// das 09:30 às 09:50. E a chamada do professor numerava "1ª aula" pela
// ordem das aulas DELE no dia (Matemática às 07:50 aparecia como "1ª aula"
// quando na verdade é a 2ª), ou mostrava só "Segunda 07:00".
//
// Agora o admin, a chamada e o painel usam as mesmas funções daqui, e a
// numeração "Nª aula" sempre significa a posição na grade do turno.
// Se a escola mudar a grade, altere só a tabela GRADE abaixo.
// =====================================================================

export const DIAS_SEMANA = [
  { value: '1', label: 'Segunda-feira', banco: 'Segunda' },
  { value: '2', label: 'Terça-feira', banco: 'Terça' },
  { value: '3', label: 'Quarta-feira', banco: 'Quarta' },
  { value: '4', label: 'Quinta-feira', banco: 'Quinta' },
  { value: '5', label: 'Sexta-feira', banco: 'Sexta' },
  { value: '6', label: 'Sábado', banco: 'Sábado' },
];

// [início, fim] de cada aula. Manhã = igual ao cronograma do banco
// (database/init/01-edutrackpro.sql): 3 aulas, intervalo de 20 min, 2 aulas.
export const GRADE = {
  'Manhã': [
    ['07:00', '07:50'],
    ['07:50', '08:40'],
    ['08:40', '09:30'],
    ['09:50', '10:40'],
    ['10:40', '11:30'],
  ],
  'Tarde': [
    ['13:00', '13:50'],
    ['13:50', '14:40'],
    ['14:40', '15:30'],
    ['15:50', '16:40'],
    ['16:40', '17:30'],
  ],
  'Noite': [
    ['19:00', '19:50'],
    ['19:50', '20:40'],
    ['21:00', '21:50'],
    ['21:50', '22:40'],
  ],
};

const DURACAO = 50;

export function somarMinutos(hora, minutos) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export const paraMinutos = (hora) => {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
};

const hhmm = (hora) => (hora ? String(hora).slice(0, 5) : '');

// "Segunda" <-> "1"
export const diaParaNumero = (diaBanco) => DIAS_SEMANA.find((d) => d.banco === diaBanco)?.value ?? '';
export const numeroParaDia = (numero) => DIAS_SEMANA.find((d) => d.value === String(numero))?.banco ?? '';

// Posição da aula na grade do turno (1, 2, 3...) ou null se o horário não
// estiver na grade (ex.: aula de reposição cadastrada fora do padrão).
export function numeroDaAula(turno, horaInicio) {
  const indice = (GRADE[turno] ?? []).findIndex(([inicio]) => inicio === hhmm(horaInicio));
  return indice === -1 ? null : indice + 1;
}

export function fimPadrao(turno, horaInicio) {
  const slot = (GRADE[turno] ?? []).find(([inicio]) => inicio === hhmm(horaInicio));
  return slot ? slot[1] : somarMinutos(hhmm(horaInicio), DURACAO);
}

// Rótulo padrão usado em TODAS as telas: "2ª aula · 07:50–08:40"
// comDia = true acrescenta o dia na frente: "Segunda · 2ª aula · 07:50–08:40"
export function rotuloAula({ turno, dia_semana, hora_inicio, hora_fim, sala }, { comDia = false, comSala = true } = {}) {
  const numero = numeroDaAula(turno, hora_inicio);
  const fim = hhmm(hora_fim) || fimPadrao(turno, hora_inicio);
  const partes = [
    comDia && dia_semana,
    numero ? `${numero}ª aula` : 'Aula extra',
    `${hhmm(hora_inicio)}–${fim}`,
    comSala && sala,
  ];
  return partes.filter(Boolean).join(' · ');
}

// Opções do campo "Horário" (Selecao) para um turno. Horários que já estão
// salvos mas não fazem parte da grade continuam aparecendo (como "Aula extra"),
// senão o campo ficava em branco e o horário "sumia" ao editar.
export function opcoesHorario(turno, extras = []) {
  const turnos = turno && GRADE[turno] ? [turno] : Object.keys(GRADE);
  const opcoes = turnos.flatMap((t) =>
    GRADE[t].map(([inicio, fim], i) => ({
      value: inicio,
      label: turno ? `${i + 1}ª aula` : `${t} · ${i + 1}ª aula`,
      detalhe: `${inicio}–${fim}`,
    }))
  );
  for (const hora of extras.map(hhmm).filter(Boolean)) {
    if (!opcoes.some((o) => o.value === hora)) {
      opcoes.push({ value: hora, label: 'Aula extra', detalhe: hora });
    }
  }
  return opcoes.sort((a, b) => paraMinutos(a.value) - paraMinutos(b.value));
}
