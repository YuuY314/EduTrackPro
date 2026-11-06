// =====================================================================
// config/database.js - UM pool de conexões para a aplicação inteira
//
// Todos os models importam este mesmo "pool". Antes cada model chamava
// criarPool() e o servidor abria 3 pools (30 conexões) sem precisar.
// =====================================================================

import mysql from 'mysql2/promise';

import { ambiente } from './ambiente.js';

export const pool = mysql.createPool({
  ...ambiente.db,
  connectionLimit: 10,      // até 10 conexões simultâneas
  waitForConnections: true, // se as 10 estiverem ocupadas, a requisição espera na fila
  queueLimit: 0,            // fila sem limite (ok em desenvolvimento; em produção use 30-50)
});

// Executa várias queries como um bloco só: ou tudo grava, ou nada grava.
// Usado ao criar um aluno/professor (precisa criar o usuário junto).
export async function emTransacao(funcao) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await funcao(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}
