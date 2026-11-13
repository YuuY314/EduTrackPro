import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarAvaliacao(linha) {
  if (!linha) return null;
  return { ...linha, peso: Number(linha.peso) };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM avaliacoes ORDER BY id_avaliacao LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM avaliacoes');

  return {
    avaliacoes: linhas.map(hidratarAvaliacao),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM avaliacoes WHERE id_avaliacao = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarAvaliacao(linhas[0]);
}

// 3. Inserção
export async function criar(avaliacao) {
  const sql = 'INSERT INTO avaliacoes (id_tdp, titulo, bimestre, peso, data) VALUES (?, ?, ?, ?, ?)';
  const valores = [avaliacao.id_tdp, avaliacao.titulo, avaliacao.bimestre, avaliacao.peso, avaliacao.data];
  const [resultado] = await pool.query(sql, valores);
  return { ...avaliacao, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, avaliacao) {
  const sql = 'UPDATE avaliacoes SET id_tdp = ?, titulo = ?, bimestre = ?, peso = ?, data = ? WHERE id_avaliacao = ?';
  const valores = [avaliacao.id_tdp, avaliacao.titulo, avaliacao.bimestre, avaliacao.peso, avaliacao.data, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE avaliacoes SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM avaliacoes WHERE id_avaliacao = ?', [id]);
  return resultado.affectedRows > 0;
}
