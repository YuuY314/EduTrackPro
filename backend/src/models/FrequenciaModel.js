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
  const valores = [frequencia.id_aula, frequencia.id_aluno, frequencia.presente, frequencia.justificativa, id];
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

//somente para fazer leitura: verifica se já existe uma aula registrada para aquele dia e turma/disciplina/professor(id_tdp), caso o professor queira corrigir ou revisar a chamada
export async function buscarChamada(id_tdp, data) {
  const [aulas] = await pool.query(
    'SELECT * FROM aulas WHERE id_tdp = ? AND data = ? ORDER BY id_aula DESC LIMIT 1',
    [id_tdp, data]
  );

  if (aulas.length === 0) {
    return { aula: null, frequencias: [] };
  }

  const aula = aulas[0];
  const [frequencias] = await pool.query(
    'SELECT id, id_aula, id_aluno, presente, justificativa FROM frequencias WHERE id_aula = ?',
    [aula.id_aula]
  );

  return { aula, frequencias };
}

// Salva (cria ou atualiza) a aula e todas as frequências dos alunos em uma única operação, na tabela aulas o registro com seu id_aula original é mantido e apenas atualizado caso tenha mudado, já na tabela frequencias o registro ligado ao id_aula são removidos e substituidos pelos novos inserts da situação de cada aluno
export async function salvarChamadaCompleta({ id_tdp, data, conteudo, registros }) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    const [existentes] = await conexao.query(
      'SELECT id_aula FROM aulas WHERE id_tdp = ? AND data = ? ORDER BY id_aula DESC LIMIT 1',
      [id_tdp, data]
    );

    let id_aula;
    if (existentes.length > 0) {
      id_aula = existentes[0].id_aula;
      await conexao.query(
        'UPDATE aulas SET conteudo = ? WHERE id_aula = ?',
        [conteudo || null, id_aula]
      );
      await conexao.query('DELETE FROM frequencias WHERE id_aula = ?', [id_aula]);
    } else {
      const [resAula] = await conexao.query(
        'INSERT INTO aulas (id_tdp, data, conteudo) VALUES (?, ?, ?)',
        [id_tdp, data, conteudo || null]
      );
      id_aula = resAula.insertId;
    }

    for (const reg of registros) {
      await conexao.query(
        'INSERT INTO frequencias (id_aula, id_aluno, presente, justificativa) VALUES (?, ?, ?, ?)',
        [id_aula, reg.id_aluno, reg.presente ? 1 : 0, reg.justificativa || null]
      );
    }

    await conexao.commit();
    return { id_aula, total_registros: registros.length };
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

export async function listarHorariosPorTdp(id_tdp) {
  const [linhas] = await pool.query(
    `SELECT id, id_tdp, dia_semana, 
            TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
            TIME_FORMAT(hora_fim, '%H:%i') AS hora_fim,
            sala
       FROM horarios_aula
      WHERE id_tdp = ?
      ORDER BY FIELD(dia_semana, 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'), hora_inicio`,
    [id_tdp]
  );
  return linhas;
}