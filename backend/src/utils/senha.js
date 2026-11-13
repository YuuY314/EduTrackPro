// =====================================================================
// utils/senha.js
// Hash e comparação de senhas com bcrypt.
//
// NUNCA guardamos a senha em si, só o "hash" (uma transformação sem volta).
// Para conferir um login, aplicamos o mesmo cálculo na senha digitada e
// comparamos com o hash salvo.
// (Usamos "bcryptjs", versão em JavaScript puro: não precisa compilar nada.)
// =====================================================================

import bcrypt from "bcryptjs";

const RODADAS = 10; // custo do cálculo: maior = mais seguro e mais lento

export function gerarHash(senha) {
  return bcrypt.hash(senha, RODADAS);
}

export function senhaConfere(senha, hash) {
  return bcrypt.compare(senha, hash);
}
