import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarDisciplina(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM disciplinas ORDER BY id_disciplina LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM disciplinas');

  return {
    disciplinas: linhas.map(hidratarDisciplina),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM disciplinas WHERE id_disciplina = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarDisciplina(linhas[0]);
}

// 3. Inserção
export async function criar(disciplina) {
  const sql = 'INSERT INTO disciplinas (nome) VALUES (?)';
  const valores = [disciplina.nome];
  const [resultado] = await pool.query(sql, valores);
  return { ...disciplina, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, disciplina) {
  const sql = 'UPDATE disciplinas SET nome = ? WHERE id_disciplina = ?';
  const valores = [disciplina.nome, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE disciplinas SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM disciplinas WHERE id_disciplina = ?', [id]);
  return resultado.affectedRows > 0;
}
