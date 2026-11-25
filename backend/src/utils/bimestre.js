// =====================================================================
// utils/bimestre.js - qual é o bimestre letivo de uma data
//
// jan-abr = 1º, mai-jul = 2º, ago-out = 3º, nov-dez = 4º.
// TEM que ser igual ao bimestreAtual() do frontend (src/lib/utils.js),
// senão o painel do admin e o do professor mostram bimestres diferentes.
// =====================================================================

export function bimestreAtual(data = new Date()) {
  const mes = data.getMonth() + 1;
  if (mes <= 4) return 1;
  if (mes <= 7) return 2;
  if (mes <= 10) return 3;
  return 4;
}
