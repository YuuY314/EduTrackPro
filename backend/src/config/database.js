import mysql from 'mysql2/promise';

export function criarPool(){
    return mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME,
        connectionLimit: 10, //Limite de conexões simultaneas.
        waitForConnections: true, // cria uma fila de novas requisições. Será usado caso as 10 conexões simultanesa esteja efetivamente em uso, para não perder nenhuma requisição, se estiver falso, não ficará em fila
        queueLimit: 0 // tamanho da fila. quantas requisições ficarao aguardando as 10 finalizarem. usar 0 (infinito) apenas em ambiente de teste, em produção, limitar a 30, 40, 50, dependendo do servidor
    })
}