import * as dbModule from '../config/database.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarNota(linha) {
  if (!linha) return null;
  return { ...linha, valor: Number(linha.valor) };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM notas ORDER BY id LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM notas');

  return {
    notas: linhas.map(hidratarNota),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM notas WHERE id = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarNota(linhas[0]);
}

// 3. Inserção
export async function criar(nota) {
  const sql = 'INSERT INTO notas (id_avaliacao, id_aluno, valor) VALUES (?, ?, ?)';
  const valores = [nota.id_avaliacao, nota.id_aluno, nota.valor];
  const [resultado] = await pool.query(sql, valores);
  return { ...nota, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, nota) {
  const sql = 'UPDATE notas SET id_avaliacao = ?, id_aluno = ?, valor = ? WHERE id = ?';
  const valores = [nota.id_avaliacao, nota.id_aluno, nota.valor, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE notas SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM notas WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

export async function buscarBoletim(id_tdp, bimestre) {
  const [avaliacoes] = await pool.query(
    'SELECT id_avaliacao, titulo, bimestre, peso FROM avaliacoes WHERE id_tdp = ? AND bimestre = ? ORDER BY id_avaliacao',
    [id_tdp, bimestre]
  );

  if (avaliacoes.length === 0) {
    return { avaliacoes: [], notas: [] };
  }

  const idsAval = avaliacoes.map((a) => a.id_avaliacao);
  const [notas] = await pool.query(
    'SELECT id, id_avaliacao, id_aluno, valor FROM notas WHERE id_avaliacao IN (?)',
    [idsAval]
  );

  return {
    avaliacoes,
    notas: notas.map(hidratarNota)
  };
}

export async function salvarBoletimCompleto({ id_tdp, bimestre, titulos, registros }) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    // 1. Garante que existam as 3 avaliações (Prova 1, Prova 2, Trabalho) para o id_tdp e bimestre
    const [existentes] = await conexao.query(
      'SELECT id_avaliacao, titulo FROM avaliacoes WHERE id_tdp = ? AND bimestre = ?',
      [id_tdp, bimestre]
    );

    const mapaAval = new Map(existentes.map((a) => [a.titulo, a.id_avaliacao]));

    for (const titulo of titulos) {
      if (!mapaAval.has(titulo)) {
        const [resAval] = await conexao.query(
          'INSERT INTO avaliacoes (id_tdp, titulo, bimestre, peso) VALUES (?, ?, ?, 1.00)',
          [id_tdp, titulo, bimestre]
        );
        mapaAval.set(titulo, resAval.insertId);
      }
    }

    // 2. Insere, atualiza ou remove (quando deixada em branco) cada nota do aluno
    let totalSalvas = 0;
    for (const reg of registros) {
      for (let i = 0; i < titulos.length; i++) {
        const id_avaliacao = mapaAval.get(titulos[i]);
        const valorRaw = reg.notas[i];

        if (valorRaw === '' || valorRaw === null || valorRaw === undefined) {
          await conexao.query(
            'DELETE FROM notas WHERE id_avaliacao = ? AND id_aluno = ?',
            [id_avaliacao, reg.id_aluno]
          );
        } else {
          const valorNum = Number(valorRaw);
          await conexao.query(
            `INSERT INTO notas (id_avaliacao, id_aluno, valor)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
            [id_avaliacao, reg.id_aluno, valorNum]
          );
          totalSalvas++;
        }
      }
    }

    await conexao.commit();
    return { total_notas: totalSalvas };
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}