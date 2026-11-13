// =====================================================================
// utils/sql.js
// Ajudante para montar UPDATEs dinâmicos (quando o cliente manda só
// alguns campos para alterar).
//
// montarSet({ nome: "Ana", peso: 0.5 }, ["nome", "peso", "data"])
//   => { set: "nome = ?, peso = ?", valores: ["Ana", 0.5] }
//
// SEGURANÇA: só entram colunas que estão na lista "permitidas" (escrita
// por nós). Os VALORES vão separados, como parâmetros (?), nunca
// concatenados no texto SQL. Isso evita SQL Injection.
// =====================================================================

export function montarSet(campos, permitidas) {
  const colunas = Object.keys(campos).filter(
    (c) => permitidas.includes(c) && campos[c] !== undefined
  );
  if (colunas.length === 0) return null; // nada para atualizar
  return {
    set: colunas.map((c) => `${c} = ?`).join(", "),
    valores: colunas.map((c) => campos[c]),
  };
}
