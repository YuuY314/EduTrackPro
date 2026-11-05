import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarProfessor(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM professores ORDER BY id_professor LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM professores');

  return {
    professores: linhas.map(hidratarProfessor),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM professores WHERE id_professor = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarProfessor(linhas[0]);
}

// 3. Inserção
export async function criar(professor) {
  const sql = 'INSERT INTO professores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)';
  const valores = [professor.id_usuario, professor.nome, professor.cpf, professor.email, professor.telefone];
  const [resultado] = await pool.query(sql, valores);
  return { ...professor, id_professor: resultado.insertId};
}

// 4. Atualização completa (PUT)
export async function atualizar(id, professor) {
  const sql = 'UPDATE professores SET nome = ?, cpf = ?, email = ?, telefone = ? WHERE id_professor = ?';
  const valores = [professor.nome, professor.cpf, professor.email, professor.telefone, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE professores SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM professores WHERE id_professor = ?', [id]);
  return resultado.affectedRows > 0;
}
