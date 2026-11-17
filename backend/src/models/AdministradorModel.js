// =====================================================================
// models/ProfessorModel.js - SQL da tabela "administradores"
// =====================================================================

import { pool } from '../config/database.js';
import { montarSet } from '../utils/sql.js';

export const COLUNAS_EDITAVEIS = ['nome', 'cpf', 'email', 'telefone'];

export async function listar({ limite, offset }) {
  const [linhas] = await pool.query('SELECT * FROM administradores ORDER BY nome LIMIT ? OFFSET ?', [limite, offset]);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM administradores');
  return { administradores: linhas, total };
}

export async function buscarPorId(id, db = pool) {
  const [linhas] = await db.execute('SELECT * FROM administradores WHERE id_admin = ?', [id]);
  return linhas[0] ?? null;
}

export async function criar(administrador, db = pool) {
  const [resultado] = await db.execute(
    'INSERT INTO administradores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)',
    [administrador.id_usuario, administrador.nome, administrador.cpf, administrador.email, administrador.telefone ?? null]
  );
  return resultado.insertId;
}

export async function atualizar(id, campos, db = pool) {
  const sql = montarSet(campos, COLUNAS_EDITAVEIS);
  if (!sql) return;
  await db.execute(`UPDATE administradores SET ${sql.set} WHERE id_admin = ?`, [...sql.valores, id]);
}

export async function excluir(id, db = pool) {
  await db.execute('DELETE FROM administradores WHERE id_admin = ?', [id]);
}
