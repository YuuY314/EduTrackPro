import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarFrequencia(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM frequencias ORDER BY id LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM frequencias');

  return {
    frequencias: linhas.map(hidratarFrequencia),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM frequencias WHERE id = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarFrequencia(linhas[0]);
}

// 3. Inserção
export async function criar(frequencia) {
  const sql = 'INSERT INTO frequencias (id_aula, id_aluno, presente, justificativa) VALUES (?, ?, ?, ?)';
  const valores = [frequencia.id_aula, frequencia.id_aluno, frequencia.presente, frequencia.justificativa];
  const [resultado] = await pool.query(sql, valores);
  return { ...frequencia, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, frequencia) {
  const sql = 'UPDATE frequencias SET id_aula = ?, id_aluno = ?, presente = ?, justificativa = ? WHERE id = ?';
  const valores = [frequencia.id_aula, frequencia.id_aluno, frequencia.presente, frequencia.justificativa];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE frequencias SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM frequencias WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
