import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarUsuario(linha) {
  if (!linha) return null;
  return { ...linha, email: Number(linha.email) };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM usuarios ORDER BY id_usuario LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');

  return {
    usuarios: linhas.map(hidratarUsuario),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarUsuario(linhas[0]);
}

// 3. Inserção
export async function criar(usuario) {
  const sql = 'INSERT INTO usuarios (email, senha_hash, perfil) VALUES (?, ?, ?, ?)';
  const valores = [usuario.email, usuario.senha_hash, usuario.perfil ];
  const [resultado] = await pool.query(sql, valores);
  return { ...usuario, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, usuario) {
  const sql = 'UPDATE usuarios SET email = ?, senha_hash = ?, perfil = ? WHERE id_usuario = ?';
  const valores = [usuario.email, usuario.senha_hash, usuario.perfil, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE usuario SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
  return resultado.affectedRows > 0;
}
