// =====================================================================
// config/database.js
// Cria o "pool" de conexões com o MySQL.
//
// O que é um pool? Abrir uma conexão nova a cada requisição é lento.
// O pool mantém algumas conexões abertas e "empresta" uma para cada
// consulta, devolvendo depois. Criamos UM pool e o compartilhamos.
// =====================================================================

import mysql from "mysql2/promise";
import { ambiente } from "./ambiente.js";

export function criarPool() {
  return mysql.createPool({
    host: ambiente.db.host,
    port: ambiente.db.port,
    user: ambiente.db.user,
    password: ambiente.db.pass,
    database: ambiente.db.nome,
    connectionLimit: 10, // no máximo 10 conexões simultâneas
    waitForConnections: true, // se as 10 estiverem ocupadas, espera uma liberar
    queueLimit: 0, // tamanho da fila de espera (0 = ilimitada; ok para estudo/teste)

    // O MySQL devolve DECIMAL (ex.: notas) como TEXTO ("7.50") por padrão.
    // Com isso ligado, ele vem como número (7.5), que é o que queremos.
    decimalNumbers: true,

    // Colunas DATE/DATETIME chegam como texto ("2026-10-19") em vez de
    // objetos Date. Evita bugs de fuso horário (data "voltando" um dia).
    dateStrings: true,
  });
}

// ---------------------------------------------------------------------
// Transação: agrupa vários comandos SQL de modo que TODOS dão certo ou
// NENHUM é salvo. Ex.: cadastrar um aluno cria usuário + responsável +
// aluno; se o 3º falhar, desfazemos os 2 primeiros (rollback).
//
// Uso:  await comTransacao(pool, async (conn) => { await conn.execute(...) })
// ---------------------------------------------------------------------
export async function comTransacao(pool, funcao) {
  const conn = await pool.getConnection(); // pega UMA conexão do pool
  try {
    await conn.beginTransaction();
    const resultado = await funcao(conn); // executa os comandos usando "conn"
    await conn.commit(); // tudo certo: confirma
    return resultado;
  } catch (erro) {
    await conn.rollback(); // algo falhou: desfaz tudo
    throw erro; // repassa o erro para o tratamento global
  } finally {
    conn.release(); // devolve a conexão ao pool, dando certo ou não
  }
}
