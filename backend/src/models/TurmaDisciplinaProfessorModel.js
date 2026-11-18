import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarTurmaDisciplinaProfessor(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM turma_disciplina_professor ORDER BY id LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM turma_disciplina_professor');

  return {
    turma_disciplina_professor: linhas.map(hidratarTurmaDisciplinaProfessor),
    total: Number(total)
  };
}

export async function listarPorProfessor(idProfessor) {
  const sql =
    `SELECT
      tdp.id AS id_tdp,
      tdp.id_turma,
      tdp.id_disciplina,
      tdp.id_professor,
      t.nome AS turma_nome,
      t.periodo AS turma_periodo,
      t.ano_letivo,
      d.nome AS disciplina_nome,
      (SELECT COUNT(*) FROM alunos al WHERE al.id_turma = t.id_turma) AS total_alunos,
      (SELECT ROUND(AVG(n.valor), 1) FROM notas n INNER JOIN avaliacoes av ON av.id_avaliacao = n.id_avaliacao WHERE av.id_tdp = tdp.id) AS media_notas,
      (SELECT ROUND(AVG(f.presente) * 100) FROM frequencias f INNER JOIN aulas au ON au.id_aula = f.id_aula WHERE au.id_tdp = tdp.id) AS percentual_presenca
    FROM turma_disciplina_professor tdp
    INNER JOIN turmas t ON t.id_turma = tdp.id_turma
    INNER JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
    WHERE tdp.id_professor = ?
    ORDER BY t.nome ASC, d.nome ASC`;

  const [linhas] = await pool.query(sql, [idProfessor]);

  return linhas.map((linha) => ({
    id_tdp: linha.id_tdp,
    id_turma: linha.id_turma,
    id_disciplina: linha.id_disciplina,
    id_professor: linha.id_professor,
    nome: linha.turma_nome,
    turno: linha.turma_periodo,
    ano_letivo: linha.ano_letivo,
    disciplina: linha.disciplina_nome,
    alunos: Number(linha.total_alunos ?? 0),
    media: linha.media_notas !== null ? Number(linha.media_notas) : null,
    presenca: linha.percentual_presenca !== null ? Number(linha.percentual_presenca) : null,
  }));
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM turma_disciplina_professor WHERE id = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarTurmaDisciplinaProfessor(linhas[0]);
}

// 3. Inserção
export async function criar(turma_disciplina_professor) {
  const sql = 'INSERT INTO turma_disciplina_professor (id_turma, id_disciplina, id_professor) VALUES (?, ?, ?)';
  const valores = [turma_disciplina_professor.id_turma, turma_disciplina_professor.id_disciplina, turma_disciplina_professor.id_professor];
  const [resultado] = await pool.query(sql, valores);
  return { ...turma_disciplina_professor, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, turma_disciplina_professor) {
  const sql = 'UPDATE turma_disciplina_professor SET id_turma = ?, id_disciplina = ?, id_professor = ? WHERE id = ?';
  const valores = [turma_disciplina_professor.id_turma, turma_disciplina_professor.id_disciplina, turma_disciplina_professor.id_professor, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE turma_disciplina_professor SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM turma_disciplina_professor WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
