// =====================================================================
// models/FaltasAlunoModel.js - SQL da VIEW "vw_faltas_aluno"
//
// Cada linha da view = 1 aluno + total de aulas, faltas e % de presença.
// Só leitura. Aluno que ainda não tem nenhuma frequência NÃO aparece na
// view (o JOIN parte da tabela frequencias) - o service trata isso.
// =====================================================================

import { pool } from '../config/database.js';

// SUM() e ROUND() chegam como texto no mysql2: convertemos tudo.
function hidratarViewFaltasAluno(linha) {
  if (!linha) return null;
  return {
    ...linha,
    total_aulas: Number(linha.total_aulas),
    faltas: Number(linha.faltas),
    percentual_presenca: Number(linha.percentual_presenca),
  };
}

export async function listar({ limite, offset }) {
  const [linhas] = await pool.query(
    'SELECT * FROM vw_faltas_aluno ORDER BY aluno LIMIT ? OFFSET ?',
    [limite, offset]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM vw_faltas_aluno');

  return { 
    faltas: linhas.map(hidratarViewFaltasAluno), 
    total: Number(total) 
  };
}

// Todas as linhas de UM aluno
export async function buscarPorAluno(id_aluno) {
  const [linhas] = await pool.query('SELECT * FROM vw_faltas_aluno WHERE id_aluno = ?', [id_aluno]);
  if (linhas.length === 0) return null;
  return hidratarViewFaltasAluno(linhas[0]);
}