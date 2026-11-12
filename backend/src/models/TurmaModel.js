import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarTurma(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM turmas ORDER BY id_turma LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM turmas');

  return {
    turmas: linhas.map(hidratarTurma),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM turmas WHERE id_turma = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarTurma(linhas[0]);
}

// 3. Inserção
export async function criar(turma) {
  const sql = 'INSERT INTO turmas (nome, periodo, ano_letivo) VALUES (?, ?, ?)';
  const valores = [turma.nome, turma.periodo, turma.ano_letivo];
  const [resultado] = await pool.query(sql, valores);
  return { ...turma, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, turma) {
  const sql = 'UPDATE turmas SET nome = ?, periodo = ?, ano_letivo = ? WHERE id_turma = ?';
  const valores = [turma.nome, turma.periodo, turma.ano_letivo, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE turmas SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM turmas WHERE id_turma = ?', [id]);
  return resultado.affectedRows > 0;
}
