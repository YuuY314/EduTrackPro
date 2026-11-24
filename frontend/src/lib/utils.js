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

// Pesos de cada avaliação do bimestre, na ordem Prova 1, Prova 2, Trabalho.
// TEM que ser igual ao "pesosPorTitulo" do backend (models/NotaModel.js),
// que é o que a view vw_boletim usa para calcular o boletim do aluno.
export const PESOS_AVALIACOES = [0.4, 0.3, 0.3];

// Média ponderada (mesma conta do boletim do aluno). Sem pesos: média simples.
export function media(notas, pesos = notas.map(() => 1)) {
  if (notas.some((n) => n === null || n === '')) return null;
  const somaPesos = pesos.reduce((total, p) => total + p, 0);
  const soma = notas.reduce((total, n, i) => total + Number(n) * pesos[i], 0);
  // 1 casa, como o ROUND(..., 1) da view. O toFixed(6) tira o "lixo" de ponto
  // flutuante (6.65 vira 66.4999... e arredondaria para 6.6 em vez de 6.7).
  return Math.round(Number(((soma / somaPesos) * 10).toFixed(6))) / 10;
}

// Bimestre do ano letivo pelo mês: jan-abr = 1º, mai-jul = 2º, ago-out = 3º, nov-dez = 4º.
// TEM que ser igual ao utils/bimestre.js do backend.
export function bimestreAtual(data = new Date()) {
  const mes = data.getMonth() + 1;
  return mes <= 4 ? 1 : mes <= 7 ? 2 : mes <= 10 ? 3 : 4;
}

// Data de hoje no fuso do navegador (YYYY-MM-DD). Não use toISOString():
// ele usa UTC e, depois das 21h no Brasil, já devolve o dia seguinte.
export function hojeLocalISO(data = new Date()) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatarData(dataISO) {
  const data = new Date(dataISO + 'T12:00:00');
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return { dia, semana: semana[0].toUpperCase() + semana.slice(1) };
}
