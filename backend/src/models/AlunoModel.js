import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarAluno(linha) {
  if (!linha) return null;
  return { ...linha, nome: Number(linha.nome) };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM alunos ORDER BY id_aluno LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM alunos');

  return {
    alunos: linhas.map(hidratarAluno),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM aluno WHERE id_aluno = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarAluno(linhas[0]);
}

// 3. Inserção
export async function criar(aluno) {
  const sql = 'INSERT INTO alunos (matricula, nome, cpf, endereco, email_institucional) VALUES (?, ?, ?, ?, ?)';
  const valores = [aluno.matricula, aluno.nome, aluno.cpf, aluno.endereco, aluno.email_institucional];
  const [resultado] = await pool.query(sql, valores);
  return { ...aluno, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, aluno) {
  const sql = 'UPDATE alunos SET matricula = ?, nome = ?, cpf = ?, endereco = ?, email_institucional = ? WHERE id_aluno = ?';
  const valores = [aluno.matricula, aluno.nome, aluno.cpf, aluno.endereco, aluno.email_institucional, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE alunos SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM alunos WHERE id_aluno = ?', [id]);
  return resultado.affectedRows > 0;
}
