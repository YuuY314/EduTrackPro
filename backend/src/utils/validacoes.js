// =====================================================================
// utils/validacoes.js
// Funções pequenas para validar valores que vêm da URL
// (req.params e req.query), que sempre chegam como texto.
// =====================================================================

import { AppError } from "./AppError.js";

// Converte "12" em 12 e rejeita "abc", "-3", "1.5", "".
export function paraId(valor, nome = "id") {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(`Parâmetro "${nome}" inválido`, 400);
  }
  return numero;
}

// Igual ao paraId, mas aceita ausência (retorna null). Útil em filtros
// opcionais da query string, como /avaliacoes?turma=1
export function paraIdOpcional(valor, nome = "id") {
  if (valor === undefined || valor === "") return null;
  return paraId(valor, nome);
}
