// =====================================================================
// config/database.js - UM pool de conexões para a aplicação inteira
//
// Todos os models importam este mesmo "pool". Antes cada model chamava
// criarPool() e o servidor abria 3 pools (30 conexões) sem precisar.
// =====================================================================

import mysql from 'mysql2/promise';

<<<<<<< HEAD
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
=======
export function criarPool(){
    return mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
        connectionLimit: 10, //Limite de conexões simultaneas.
        waitForConnections: true, // cria uma fila de novas requisições. Será usado caso as 10 conexões simultanesa esteja efetivamente em uso, para não perder nenhuma requisição, se estiver falso, não ficará em fila
        queueLimit: 0 // tamanho da fila. quantas requisições ficarao aguardando as 10 finalizarem. usar 0 (infinito) apenas em ambiente de teste, em produção, limitar a 30, 40, 50, dependendo do servidor
    })
}
>>>>>>> b4c91bd (Backend das tabelas turmas, aulas, disciplinas, turma_disciplina_professor e avaliações)
