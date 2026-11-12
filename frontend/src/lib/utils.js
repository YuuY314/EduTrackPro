export function corDaNota(nota) {
  if (nota === null || nota === undefined) return 'vazio';
  if (nota >= 7) return 'bom';
  if (nota >= 5) return 'atencao';
  return 'ruim';
}

export function corDaPresenca(porcentagem) {
  if (porcentagem >= 90) return 'bom';
  if (porcentagem >= 75) return 'atencao';
  return 'ruim';
}

export function media(notas) {
  if (notas.some((n) => n === null || n === '')) return null;
  const soma = notas.reduce((total, n) => total + Number(n), 0);
  return soma / notas.length;
}

export function formatarData(dataISO) {
  const data = new Date(dataISO + 'T12:00:00');
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return { dia, semana: semana[0].toUpperCase() + semana.slice(1) };
}
