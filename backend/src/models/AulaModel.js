import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarAula(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM aulas ORDER BY id_aula LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM aulas');

  return {
    aulas: linhas.map(hidratarAula),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM aulas WHERE id_aula = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarAula(linhas[0]);
}

// 3. Inserção
export async function criar(aula) {
  const sql = 'INSERT INTO aulas (id_tdp, data, conteudo) VALUES (?, ?, ?)';
  const valores = [aula.id_tdp, aula.data, aula.conteudo];
  const [resultado] = await pool.query(sql, valores);
  return { ...aula, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, aula) {
  const sql = 'UPDATE aulas SET id_tdp = ?, data = ?, conteudo = ? WHERE id_aula = ?';
  const valores = [aula.id_tdp, aula.data, aula.conteudo, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE aulas SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM aulas WHERE id_aula = ?', [id]);
  return resultado.affectedRows > 0;
}
