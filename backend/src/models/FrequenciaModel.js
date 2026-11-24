import * as dbModule from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { garantirAlunosDaTdp } from '../utils/permissoes.js';

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

// Acha a aula daquele vínculo + data + horário.
// - com id_horario: a aula daquele horário; se não houver, uma aula ANTIGA do
//   mesmo dia ainda sem horário (criada antes da coluna id_horario existir)
// - sem id_horario: a aula mais recente do dia (comportamento antigo; usado pelo painel)
async function acharAula(db, id_tdp, data, id_horario) {
  if (id_horario) {
    const [doHorario] = await db.query(
      'SELECT * FROM aulas WHERE id_tdp = ? AND data = ? AND id_horario = ? LIMIT 1',
      [id_tdp, data, id_horario]
    );
    if (doHorario[0]) return doHorario[0];
    const [semHorario] = await db.query(
      'SELECT * FROM aulas WHERE id_tdp = ? AND data = ? AND id_horario IS NULL ORDER BY id_aula LIMIT 1',
      [id_tdp, data]
    );
    return semHorario[0] ?? null;
  }
  const [linhas] = await db.query(
    'SELECT * FROM aulas WHERE id_tdp = ? AND data = ? ORDER BY id_aula DESC LIMIT 1',
    [id_tdp, data]
  );
  return linhas[0] ?? null;
}

//somente para fazer leitura: verifica se já existe uma aula registrada para aquele dia, turma/disciplina/professor(id_tdp) e horário, caso o professor queira corrigir ou revisar a chamada
export async function buscarChamada(id_tdp, data, id_horario = null) {
  const aula = await acharAula(pool, id_tdp, data, id_horario);
  if (!aula) {
    return { aula: null, frequencias: [] };
  }

  const [frequencias] = await pool.query(
    'SELECT id, id_aula, id_aluno, presente, justificativa FROM frequencias WHERE id_aula = ?',
    [aula.id_aula]
  );

  return { aula, frequencias };
}

// Salva (cria ou atualiza) a aula daquele horário e todas as frequências dos alunos em uma única operação.
// Cada horário do dia tem a sua aula (aula dupla = 2 aulas = 2 chamadas). O registro de aulas é mantido e só
// atualizado; as frequências daquela aula são apagadas e gravadas de novo com a situação de cada aluno.
// "conteudo" só é alterado se vier na requisição (não apaga o conteúdo já registrado da aula).
export async function salvarChamadaCompleta({ id_tdp, id_horario = null, data, conteudo, registros }) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    await garantirAlunosDaTdp(id_tdp, registros.map((r) => r.id_aluno), conexao);

    if (id_horario) {
      const [horario] = await conexao.query(
        'SELECT id FROM horarios_aula WHERE id = ? AND id_tdp = ?',
        [id_horario, id_tdp]
      );
      if (!horario[0]) {
        throw new AppError('Esse horário não pertence a essa turma/disciplina.', 422);
      }
    }

    const existente = await acharAula(conexao, id_tdp, data, id_horario);

    let id_aula;
    if (existente) {
      id_aula = existente.id_aula;
      await conexao.query(
        'UPDATE aulas SET id_horario = COALESCE(?, id_horario), conteudo = IF(?, ?, conteudo) WHERE id_aula = ?',
        [id_horario, conteudo !== undefined, conteudo || null, id_aula]
      );
      await conexao.query('DELETE FROM frequencias WHERE id_aula = ?', [id_aula]);
    } else {
      const [resAula] = await conexao.query(
        'INSERT INTO aulas (id_tdp, id_horario, data, conteudo) VALUES (?, ?, ?, ?)',
        [id_tdp, id_horario, data, conteudo || null]
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