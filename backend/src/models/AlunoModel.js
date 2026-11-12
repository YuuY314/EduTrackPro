// =====================================================================
// models/AlunoModel.js - SQL da tabela "alunos"
// =====================================================================

import { pool } from '../config/database.js';
import { montarSet } from '../utils/sql.js';

export const COLUNAS_EDITAVEIS = [
  'id_turma', 'id_responsavel', 'matricula', 'nome', 'cpf', 'endereco', 'email_institucional',
];

const SELECT_ALUNO = `
  SELECT a.*, t.nome AS turma, r.nome AS responsavel
    FROM alunos a
    JOIN turmas       t ON t.id_turma       = a.id_turma
    JOIN responsaveis r ON r.id_responsavel = a.id_responsavel`;

export async function listar({ limite, offset }) {
  // LIMIT/OFFSET com "?" exigem query() em vez de execute() no mysql2
  const [linhas] = await pool.query(`${SELECT_ALUNO} ORDER BY a.nome LIMIT ? OFFSET ?`, [limite, offset]);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM alunos');
  return { alunos: linhas, total };
}

export async function buscarPorId(id, db = pool) {
  const [linhas] = await db.execute(`${SELECT_ALUNO} WHERE a.id_aluno = ?`, [id]);
  return linhas[0] ?? null;
}

export async function criar(aluno, db = pool) {
  const [resultado] = await db.execute(
    `INSERT INTO alunos (id_usuario, id_turma, id_responsavel, matricula, nome, cpf, endereco, email_institucional)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [aluno.id_usuario, aluno.id_turma, aluno.id_responsavel, aluno.matricula,
     aluno.nome, aluno.cpf, aluno.endereco ?? null, aluno.email_institucional]
  );
  return resultado.insertId;
}

// Atualiza só os campos enviados (montarSet ignora o resto).
export async function atualizar(id, campos, db = pool) {
  const sql = montarSet(campos, COLUNAS_EDITAVEIS);
  if (!sql) return;
  await db.execute(`UPDATE alunos SET ${sql.set} WHERE id_aluno = ?`, [...sql.valores, id]);
}

export async function excluir(id, db = pool) {
  await db.execute('DELETE FROM alunos WHERE id_aluno = ?', [id]);
}
