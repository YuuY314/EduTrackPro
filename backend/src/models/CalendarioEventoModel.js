// =====================================================================
// models/CalendarioEventoModel.js - SQL da tabela "calendario_eventos"
// =====================================================================

import * as dbModule from '../config/database.js';

const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

//foramata o resultado paar o que o frontend espera
function hidratarEvento(linha) {
  if (!linha) return null;
  return {
    ...linha,
    id: linha.id_evento,
    professor: linha.professor_nome ?? null,
    turma: linha.turma_nome ?? '',
    descricao: linha.descricao ?? '',
    motivo: linha.motivo ?? '',
  };
}
//listagem dinamica para todas as situações do status
//id_turma (opcional): só eventos gerais (sem turma) + os daquela turma (usado para o aluno)
export async function listar({ status, id_turma } = {}) {
  const condicoes = [];
  const valores = [];

  if (status) {
    condicoes.push('ce.status = ?');
    valores.push(status);
  }
  if (id_turma) {
    condicoes.push('(ce.id_turma IS NULL OR ce.id_turma = ?)');
    valores.push(id_turma);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [linhas] = await pool.query(
    `SELECT ce.id_evento,
            ce.id_professor,
            ce.id_turma,
            DATE_FORMAT(ce.data, '%Y-%m-%d') AS data,
            ce.tipo,
            ce.descricao,
            ce.status,
            ce.motivo,
            p.nome AS professor_nome,
            t.nome AS turma_nome
     FROM calendario_eventos ce
     LEFT JOIN professores p ON p.id_professor = ce.id_professor
     LEFT JOIN turmas t ON t.id_turma = ce.id_turma
     ${where}
     ORDER BY ce.data ASC, ce.id_evento ASC`,
    valores
  );

  return linhas.map(hidratarEvento);
}

//busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query(
    `SELECT ce.id_evento,
            ce.id_professor,
            ce.id_turma,
            DATE_FORMAT(ce.data, '%Y-%m-%d') AS data,
            ce.tipo,
            ce.descricao,
            ce.status,
            ce.motivo,
            p.nome AS professor_nome,
            t.nome AS turma_nome
     FROM calendario_eventos ce
     LEFT JOIN professores p ON p.id_professor = ce.id_professor
     LEFT JOIN turmas t ON t.id_turma = ce.id_turma
     WHERE ce.id_evento = ?`,
    [id]
  );

  if (linhas.length === 0) return null;
  return hidratarEvento(linhas[0]);
}

//faz uma busca na tabela professores para saber qual id_professor pertence aquele id_usuario logado
export async function buscarProfessorPorUsuario(id_usuario) {
  const [linhas] = await pool.query(
    'SELECT id_professor FROM professores WHERE id_usuario = ?',
    [id_usuario]
  );
  return linhas.length > 0 ? linhas[0].id_professor : null;
}

//Inserção (POST)
export async function criar(evento) {
  const sql = `
    INSERT INTO calendario_eventos (id_professor, id_turma, data, tipo, descricao, status, motivo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const valores = [
    evento.id_professor,
    evento.id_turma,
    evento.data,
    evento.tipo,
    evento.descricao,
    evento.status,
    evento.motivo,
  ];
  const [resultado] = await pool.query(sql, valores);
  return await buscarPorId(resultado.insertId);
}

//Atualização (PUT / PATCH)
export async function atualizar(id, dados) {
  const campos = [];
  const valores = [];

  for (const chave of ['id_turma', 'data', 'tipo', 'descricao', 'status', 'motivo']) {
    if (dados[chave] !== undefined) {
      campos.push(`${chave} = ?`);
      valores.push(dados[chave]);
    }
  }

  if (campos.length === 0) return false;

  valores.push(id);
  const [resultado] = await pool.query(
    `UPDATE calendario_eventos SET ${campos.join(', ')} WHERE id_evento = ?`,
    valores
  );
  return resultado.affectedRows > 0;
}

//Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query(
    'DELETE FROM calendario_eventos WHERE id_evento = ?',
    [id]
  );
  return resultado.affectedRows > 0;
}