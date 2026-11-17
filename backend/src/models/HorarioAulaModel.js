import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarHorarioAula(linha) {
  if (!linha) return null;
  return { ...linha };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM horarios_aula ORDER BY id LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM horarios_aula');

  return {
    horarios_aula: linhas.map(hidratarHorarioAula),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM horarios_aula WHERE id = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarHorarioAula(linhas[0]);
}

// 3. Inserção
export async function criar(horario_aula) {
  const sql = 'INSERT INTO horarios_aula (id_tdp, dia_semana, hora_inicio, hora_fim, sala) VALUES (?, ?, ?, ?, ?)';
  const valores = [horario_aula.id_tdp, horario_aula.dia_semana, horario_aula.hora_inicio, horario_aula.hora_fim, horario_aula.sala];
  const [resultado] = await pool.query(sql, valores);
  return { ...horario_aula, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, horario_aula) {
  const sql = 'UPDATE horarios_aula SET id_tdp = ?, dia_semana = ?, hora_inicio = ?, hora_fim = ?, sala = ? WHERE id = ?';
  const valores = [horario_aula.id_tdp, horario_aula.dia_semana, horario_aula.hora_inicio, horario_aula.hora_fim, horario_aula.sala, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE horarios_aula SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM horarios_aula WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
