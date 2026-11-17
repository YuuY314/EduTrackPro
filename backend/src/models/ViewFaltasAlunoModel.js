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

// Resumo agrupado por componente/disciplina para montar a tabela do aluno
export async function buscarPorComponente(id_aluno) {
  const [linhas] = await pool.query(
    `SELECT 
       d.nome AS componente,
       COUNT(f.id) AS total_aulas,
       SUM(CASE WHEN f.presente = 0 THEN 1 ELSE 0 END) AS faltas,
       ROUND((SUM(CASE WHEN f.presente = 1 THEN 1 ELSE 0 END) / COUNT(f.id)) * 100, 1) AS presenca
     FROM frequencias f
     INNER JOIN aulas a ON a.id_aula = f.id_aula
     INNER JOIN turma_disciplina_professor tdp ON tdp.id = a.id_tdp
     INNER JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
     WHERE f.id_aluno = ?
     GROUP BY d.id_disciplina, d.nome
     ORDER BY d.nome`,
    [id_aluno]
  );

  return linhas.map((l) => ({
    componente: l.componente,
    total_aulas: Number(l.total_aulas),
    faltas: Number(l.faltas),
    presenca: Number(l.presenca),
  }));
}

// Ultimas dias com falta para o card, buscando os dias que o aluno teve pelo menos uma falta
export async function buscarDiasComFalta(id_aluno) {
  const [linhas] = await pool.query(
    `SELECT 
       DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
       COUNT(f.id) AS qtd_aulas,
       MAX(f.justificativa) AS justificativa
     FROM frequencias f
     INNER JOIN aulas a ON a.id_aula = f.id_aula
     WHERE f.id_aluno = ? AND f.presente = 0
     GROUP BY a.data
     ORDER BY a.data DESC`,
    [id_aluno]
  );

  return linhas.map((l) => ({
    data: l.data,
    qtd_aulas: Number(l.qtd_aulas),
    justificativa: l.justificativa || null,
  }));
}