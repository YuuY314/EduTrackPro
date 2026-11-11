// =====================================================================
// models/UsuarioModel.js - SQL da tabela "usuarios" (o LOGIN)
//
// A tabela usuarios guarda só e-mail, hash da senha e perfil. O nome
// fica em alunos/professores, por isso as buscas fazem LEFT JOIN nas
// duas e devolvem também id_aluno / id_professor (que vão para o token).
//
// O parâmetro "db" permite rodar a query dentro de uma transação
// (emTransacao) ou direto no pool (padrão).
// =====================================================================

import { pool } from '../config/database.js';

const SELECT_USUARIO = `
    SELECT  u.id_usuario, 
            u.email, 
            u.senha_hash, 
            u.perfil,
            a.id_aluno, 
            p.id_professor,
            adm.id_admin,
            COALESCE(a.nome, p.nome, adm.nome, 'Usuário') AS nome,
            t.nome AS turma,
            t.periodo AS turno
    FROM usuarios u
    LEFT JOIN alunos      a ON a.id_usuario = u.id_usuario
    LEFT JOIN turmas     t ON t.id_turma = a.id_turma
    LEFT JOIN professores p ON p.id_usuario = u.id_usuario
    LEFT JOIN administradores adm ON adm.id_usuario = u.id_usuario`;

// Login aceita e-mail OU RA (matrícula do aluno).
export async function buscarParaLogin(login) {
  const [linhas] = await pool.execute(
    `${SELECT_USUARIO} WHERE u.email = ? OR a.matricula = ? LIMIT 1`,
    [login, login]
  );
  return linhas[0] ?? null;
}

export async function buscarPorId(id) {
  const [linhas] = await pool.execute(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, [id]);
  return linhas[0] ?? null;
}

export async function criar({ email, senha_hash, perfil }, db = pool) {
  const [resultado] = await db.execute(
    'INSERT INTO usuarios (email, senha_hash, perfil) VALUES (?, ?, ?)',
    [email, senha_hash, perfil]
  );
  return resultado.insertId;
}

export async function atualizarEmail(id, email, db = pool) {
  await db.execute('UPDATE usuarios SET email = ? WHERE id_usuario = ?', [email, id]);
}

export async function excluir(id, db = pool) {
  await db.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
}
