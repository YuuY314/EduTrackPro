import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarTarefa(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM tarefas ORDER BY id_tarefa LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM tarefas');

  return {
    tarefas: linhas.map(hidratarTarefa),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM tarefas WHERE id_tarefa = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarTarefa(linhas[0]);
}

// 3. Inserção
export async function criar(tarefa) {
  const sql = 'INSERT INTO tarefas (id_tdp, titulo, descricao, data_entrega) VALUES (?)';
  const valores = [tarefa.id_tdp, tarefa.titulo, tarefa.descricao, tarefa.data_entrega];
  const [resultado] = await pool.query(sql, valores);
  return { ...tarefa, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, tarefa) {
  const sql = 'UPDATE tarefas SET id_tdp = ?, titulo = ?, descricao = ?, data_entrega = ? WHERE id_tarefa = ?';
  const valores = [tarefa.id_tdp, tarefa.titulo, tarefa.descricao, tarefa.data_entrega, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE tarefas SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM tarefas WHERE id_tarefa = ?', [id]);
  return resultado.affectedRows > 0;
}
