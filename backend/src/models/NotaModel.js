import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarNota(linha) {
  if (!linha) return null;
  return { ...linha, valor: Number(linha.valor) };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM notas ORDER BY id LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM notas');

  return {
    notas: linhas.map(hidratarNota),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM notas WHERE id = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarNota(linhas[0]);
}

// 3. Inserção
export async function criar(nota) {
  const sql = 'INSERT INTO notas (id_avaliacao, id_aluno, valor) VALUES (?, ?, ?)';
  const valores = [nota.id_avaliacao, nota.id_aluno, nota.valor];
  const [resultado] = await pool.query(sql, valores);
  return { ...nota, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, nota) {
  const sql = 'UPDATE notas SET id_avaliacao = ?, id_aluno = ?, valor = ? WHERE id = ?';
  const valores = [nota.id_avaliacao, nota.id_aluno, nota.valor, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE notas SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM notas WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
