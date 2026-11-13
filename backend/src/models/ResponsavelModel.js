import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarResponsavel(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM responsaveis ORDER BY id_responsavel LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM responsaveis');

  return {
    responsaveis: linhas.map(hidratarResponsavel),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM responsaveis WHERE id_responsavel = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarResponsavel(linhas[0]);
}

// 3. Inserção
export async function criar(responsavel) {
  const sql = 'INSERT INTO responsaveis (nome, cpf, telefone, email, parentesco) VALUES (?, ?, ?, ?, ?)';
  const valores = [responsavel.nome, responsavel.cpf, responsavel.telefone, responsavel.email, responsavel.parentesco];
  const [resultado] = await pool.query(sql, valores);
  return { ...responsavel, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, responsavel) {
  const sql = 'UPDATE responsaveis SET nome = ?, cpf = ?, telefone = ?, email = ?, parentesco = ? WHERE id_responsavel = ?';
  const valores = [responsavel.nome, responsavel.cpf, responsavel.telefone, responsavel.email, responsavel.parentesco, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE responsaveis SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM responsaveis WHERE id_responsavel = ?', [id]);
  return resultado.affectedRows > 0;
}
