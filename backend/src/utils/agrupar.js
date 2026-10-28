// =====================================================================
// utils/agrupar.js
// O SQL devolve "uma linha por turma+disciplina". A API fica mais útil
// devolvendo cada turma UMA vez, com suas disciplinas dentro:
//
//   [{ id_turma: 1, nome: "3A", disciplinas: [{ id_tdp: 2, disciplina: "Matemática" }] }]
// =====================================================================

export function agruparTurmas(linhas) {
  const mapa = new Map(); // id_turma -> objeto da turma

  for (const l of linhas) {
    if (!mapa.has(l.id_turma)) {
      mapa.set(l.id_turma, {
        id_turma: l.id_turma,
        nome: l.nome,
        periodo: l.periodo,
        ano_letivo: l.ano_letivo,
        disciplinas: [],
      });
    }
    mapa.get(l.id_turma).disciplinas.push({ id_tdp: l.id_tdp, disciplina: l.disciplina });
  }

  return [...mapa.values()];
}
