// =====================================================================
// models/ProfessorModel.js - SQL da tabela "professores"
// =====================================================================

import { pool } from '../config/database.js';
import { montarSet } from '../utils/sql.js';
import { AppError } from '../utils/AppError.js';

export const COLUNAS_EDITAVEIS = ['nome', 'cpf', 'email', 'telefone'];

const NUM_PARA_DIA = {
  '1': 'Segunda',
  '2': 'Terça',
  '3': 'Quarta',
  '4': 'Quinta',
  '5': 'Sexta',
  '6': 'Sábado',
};

const DIA_PARA_NUM = {
  Segunda: '1',
  Terça: '2',
  Quarta: '3',
  Quinta: '4',
  Sexta: '5',
  Sábado: '6',
};

function somar50Minutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + 50;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export async function listar({ limite, offset }) {
  const [linhas] = await pool.query('SELECT * FROM professores ORDER BY nome LIMIT ? OFFSET ?', [limite, offset]);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM professores');

  for (const prof of linhas) {
    await anexarDetalhes(prof, pool);
  }

  return { professores: linhas, total };
}

export async function buscarPorId(id, db = pool) {
  const [linhas] = await db.execute('SELECT * FROM professores WHERE id_professor = ?', [id]);
  const prof = linhas[0] ?? null;
  if (prof) {
    await anexarDetalhes(prof, db);
  }
  return prof;
}

async function anexarDetalhes(prof, db) {
  // 1. Busca vínculos (turmas e disciplinas)
  const [vinculos] = await db.execute(
    `SELECT tdp.id AS id_tdp, tdp.id_turma, tdp.id_disciplina, d.nome AS disciplina
     FROM turma_disciplina_professor tdp
     INNER JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
     WHERE tdp.id_professor = ?`,
    [prof.id_professor]
  );

  prof.vinculos = vinculos;
  prof.ids_turmas = [...new Set(vinculos.map((v) => Number(v.id_turma)))];
  prof.disciplinas = [...new Set(vinculos.map((v) => v.disciplina))];
  prof.disciplina = prof.disciplinas.length ? prof.disciplinas.join(', ') : 'Sem disciplina';

  // 2. Busca horários e já formata no padrão esperado pelo SecaoHorarios ({ turmas, dia, hora })
  const [rowsHorarios] = await db.execute(
    `SELECT h.id,
            h.id_tdp,
            tdp.id_turma,
            d.nome AS disciplina,
            h.dia_semana,
            TIME_FORMAT(h.hora_inicio, '%H:%i') AS hora_inicio,
            TIME_FORMAT(h.hora_fim, '%H:%i') AS hora_fim,
            h.sala
     FROM horarios_aula h
     INNER JOIN turma_disciplina_professor tdp ON tdp.id = h.id_tdp
     INNER JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
     WHERE tdp.id_professor = ?
     ORDER BY FIELD(h.dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado'), h.hora_inicio`,
    [prof.id_professor]
  );

  // Agrupa horários no mesmo dia/hora (caso o usuário tenha selecionado múltiplas turmas no mesmo card)
  const agrupados = new Map();
  for (const h of rowsHorarios) {
    const diaNum = DIA_PARA_NUM[h.dia_semana] ?? h.dia_semana;
    const chave = `${diaNum}-${h.hora_inicio}`;
    if (!agrupados.has(chave)) {
      agrupados.set(chave, {
        id: h.id,
        turmas: [String(h.id_turma)],
        dia: diaNum,
        hora: h.hora_inicio,
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
        sala: h.sala,
      });
    } else {
      const item = agrupados.get(chave);
      if (!item.turmas.includes(String(h.id_turma))) {
        item.turmas.push(String(h.id_turma));
      }
    }
  }

  prof.horarios = [...agrupados.values()];
}

export async function criar(professor, db = pool) {
  const [resultado] = await db.execute(
    'INSERT INTO professores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)',
    [professor.id_usuario, professor.nome, professor.cpf, professor.email, professor.telefone ?? null]
  );
  return resultado.insertId;
}

export async function atualizar(id, campos, db = pool) {
  const sql = montarSet(campos, COLUNAS_EDITAVEIS);
  if (!sql) return;
  await db.execute(`UPDATE professores SET ${sql.set} WHERE id_professor = ?`, [...sql.valores, id]);
}

export async function sincronizarVinculosEHorarios(
  idProfessor,
  { disciplinas = [], id_turmas = [], horarios = [] },
  db = pool
) {
  // 1. Busca os IDs das disciplinas pelos nomes enviados
  let rowsDisc = [];
  if (disciplinas.length > 0) {
    const placeholders = disciplinas.map(() => '?').join(',');
    const [resDisc] = await db.execute(
      `SELECT id_disciplina, nome FROM disciplinas WHERE nome IN (${placeholders})`,
      disciplinas
    );
    rowsDisc = resDisc;
  }

  // 2. Busca os vínculos atuais desse professor no banco
  const [atuais] = await db.execute(
    'SELECT id, id_turma, id_disciplina FROM turma_disciplina_professor WHERE id_professor = ?',
    [idProfessor]
  );

  const desejados = [];
  for (const idTurma of id_turmas) {
    for (const disc of rowsDisc) {
      desejados.push({
        id_turma: Number(idTurma),
        id_disciplina: Number(disc.id_disciplina),
        nome_disciplina: disc.nome,
      });
    }
  }

  const chave = (t, d) => `${t}-${d}`;
  const chavesDesejadas = new Set(desejados.map((item) => chave(item.id_turma, item.id_disciplina)));
  const mapaAtuais = new Map(atuais.map((item) => [chave(item.id_turma, item.id_disciplina), item.id]));

  // 3. Remove APENAS os vínculos que foram desmarcados
  for (const item of atuais) {
    if (!chavesDesejadas.has(chave(item.id_turma, item.id_disciplina))) {
      await db.execute('DELETE FROM turma_disciplina_professor WHERE id = ?', [item.id]);
    }
  }

  // 4. Insere apenas os novos vínculos e monta o mapa de id_tdp
  const mapaTdp = new Map();

  for (const item of desejados) {
    const k = chave(item.id_turma, item.id_disciplina);
    let idTdp = mapaAtuais.get(k);

    if (!idTdp) {
      try {
        const [res] = await db.execute(
          'INSERT INTO turma_disciplina_professor (id_turma, id_disciplina, id_professor) VALUES (?, ?, ?)',
          [item.id_turma, item.id_disciplina, idProfessor]
        );
        idTdp = res.insertId;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          throw new AppError(
            `A disciplina "${item.nome_disciplina}" já possui outro professor atribuído nesta turma.`,
            409
          );
        }
        throw err;
      }
    }

    mapaTdp.set(`${item.id_turma}-${item.nome_disciplina}`, idTdp);
    mapaTdp.set(`${item.id_turma}`, idTdp);
  }

  // 5. Atualiza horários em horarios_aula traduzindo { turmas, dia, hora } -> (id_tdp, dia_semana, hora_inicio, hora_fim)
  await db.execute(
    `DELETE h FROM horarios_aula h
     INNER JOIN turma_disciplina_professor tdp ON tdp.id = h.id_tdp
     WHERE tdp.id_professor = ?`,
    [idProfessor]
  );

  for (const h of horarios) {
    const listaTurmas = Array.isArray(h.turmas)
      ? h.turmas
      : h.id_turma ?? h.turma
      ? [h.id_turma ?? h.turma]
      : [];

    const diaBanco = NUM_PARA_DIA[String(h.dia)] ?? h.dia_semana ?? h.dia;
    const inicio = h.hora ?? h.hora_inicio;
    const fim = h.hora_fim ?? (inicio ? somar50Minutos(inicio) : null);
    const sala = h.sala?.trim() || null;

    if (!diaBanco || !inicio || !fim) continue;

    for (const t of listaTurmas) {
      const idTurma = Number(t);
      const idTdp =
        (h.disciplina && mapaTdp.get(`${idTurma}-${h.disciplina}`)) ||
        mapaTdp.get(`${idTurma}`);

      if (!idTdp) continue;

      await db.execute(
        `INSERT IGNORE INTO horarios_aula (id_tdp, dia_semana, hora_inicio, hora_fim, sala)
         VALUES (?, ?, ?, ?, ?)`,
        [idTdp, diaBanco, inicio, fim, sala]
      );
    }
  }
}

export async function excluir(id, db = pool) {
  await db.execute('DELETE FROM professores WHERE id_professor = ?', [id]);
}