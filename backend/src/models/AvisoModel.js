import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarAviso(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM avisos ORDER BY id_aviso LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM avisos');

  return {
    avisos: linhas.map(hidratarAviso),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM avisos WHERE id_aviso = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarAviso(linhas[0]);
}

// 3. Inserção
export async function criar(aviso) {
  const sql = 'INSERT INTO avisos (id_autor, id_turma, titulo, texto, data_publicacao) VALUES (?, ?, ?, ?, ?)';
  const valores = [aviso.id_autor, aviso.id_turma, aviso.titulo, aviso.texto, aviso.data_publicacao];
  const [resultado] = await pool.query(sql, valores);
  return { ...aviso, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, aviso) {
  const sql = 'UPDATE avisos SET id_autor = ?, id_turma = ?, titulo = ?, texto = ?, data_publicacao = ? WHERE id_aviso = ?';
  const valores = [aviso.id_autor, aviso.id_turma, aviso.titulo, aviso.texto, aviso.data_publicacao, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE avisos SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM avisos WHERE id_aviso = ?', [id]);
  return resultado.affectedRows > 0;
}
