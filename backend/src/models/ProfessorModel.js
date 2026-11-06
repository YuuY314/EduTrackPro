// =====================================================================
// models/ProfessorModel.js - SQL da tabela "professores"
// =====================================================================

import { pool } from '../config/database.js';
import { montarSet } from '../utils/sql.js';

export const COLUNAS_EDITAVEIS = ['nome', 'cpf', 'email', 'telefone'];

export async function listar({ limite, offset }) {
  const [linhas] = await pool.query('SELECT * FROM professores ORDER BY nome LIMIT ? OFFSET ?', [limite, offset]);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM professores');
  return { professores: linhas, total };
}

export async function buscarPorId(id, db = pool) {
  const [linhas] = await db.execute('SELECT * FROM professores WHERE id_professor = ?', [id]);
  return linhas[0] ?? null;
}

export async function criar(professor, db = pool) {
  const [resultado] = await db.execute(
    'INSERT INTO professores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)',
    [professor.id_usuario, professor.nome, professor.cpf, professor.email, professor.telefone ?? null]
  );
  return resultado.insertId;
}

export async function atualizar(id, campos, db = pool) {
  const sql = montarSet(campos, COLUNAS_EDITAVEIS);
  if (!sql) return;
  await db.execute(`UPDATE professores SET ${sql.set} WHERE id_professor = ?`, [...sql.valores, id]);
}

export async function excluir(id, db = pool) {
  await db.execute('DELETE FROM professores WHERE id_professor = ?', [id]);
}
