// =====================================================================
// models/ProfessorModel.js - SQL da tabela "professores" e dos vínculos
// (turma_disciplina_professor) e horários (horarios_aula) do professor
//
// FORMATO usado pela tela de edição (e devolvido por buscarPorId):
//   vinculos: [{ id_tdp, id_turma, turma, turno, id_disciplina, disciplina, em_uso }]
//   horarios: [{ id, id_tdp, id_turma, id_disciplina, disciplina, dia: '1'..'6',
//                dia_semana, hora_inicio: 'HH:MM', hora_fim: 'HH:MM', sala }]
//
// Cada vínculo é um PAR turma + disciplina. Antes a tela mandava
// "disciplinas" e "turmas" separadas e o backend cruzava tudo com tudo
// (2 matérias x 2 turmas = 4 vínculos), criando aulas que ninguém pediu.
// =====================================================================

import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { montarSet } from '../utils/sql.js';

export const COLUNAS_EDITAVEIS = ['nome', 'cpf', 'email', 'telefone'];

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const NUM_PARA_DIA = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
const DIA_PARA_NUM = Object.fromEntries(Object.entries(NUM_PARA_DIA).map(([n, d]) => [d, n]));
const DURACAO_PADRAO = 50; // minutos, mesma duração da grade (frontend/src/lib/grade.js)

const paraMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};
const deMinutos = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

// Aceita "07:00" ou "07:00:00" e devolve sempre "07:00".
function lerHora(valor, campo) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(texto)) {
    throw new AppError(`Horário inválido em "${campo}" (use HH:MM).`, 400);
  }
  return texto.slice(0, 5);
}

function lerIdPositivo(valor, campo) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(`Parâmetro "${campo}" inválido.`, 400);
  }
  return numero;
}

// ---------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------

export async function listar({ limite, offset }) {
  const [linhas] = await pool.query('SELECT * FROM professores ORDER BY nome LIMIT ? OFFSET ?', [limite, offset]);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM professores');

  for (const prof of linhas) {
    await anexarDetalhes(prof, pool);
  }

  return { professores: linhas, total: Number(total) };
}

export async function buscarPorId(id, db = pool) {
  const [linhas] = await db.query('SELECT * FROM professores WHERE id_professor = ?', [id]);
  const prof = linhas[0] ?? null;
  if (prof) await anexarDetalhes(prof, db);
  return prof;
}

async function anexarDetalhes(prof, db) {
  const [vinculos] = await db.query(
    `SELECT tdp.id AS id_tdp, tdp.id_turma, t.nome AS turma, t.periodo AS turno,
            tdp.id_disciplina, d.nome AS disciplina,
            (EXISTS (SELECT 1 FROM aulas      WHERE id_tdp = tdp.id)
          OR EXISTS (SELECT 1 FROM avaliacoes WHERE id_tdp = tdp.id)
          OR EXISTS (SELECT 1 FROM tarefas    WHERE id_tdp = tdp.id)) AS em_uso
       FROM turma_disciplina_professor tdp
       JOIN turmas t      ON t.id_turma = tdp.id_turma
       JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
      WHERE tdp.id_professor = ?
      ORDER BY t.nome, d.nome`,
    [prof.id_professor]
  );

  prof.vinculos = vinculos.map((v) => ({ ...v, em_uso: Boolean(Number(v.em_uso)) }));
  prof.ids_turmas = [...new Set(vinculos.map((v) => Number(v.id_turma)))];
  prof.disciplinas = [...new Set(vinculos.map((v) => v.disciplina))];
  prof.disciplina = prof.disciplinas.length ? prof.disciplinas.join(', ') : 'Sem disciplina';

  // Um item por linha de horarios_aula. Antes os horários eram agrupados por
  // dia+hora e perdiam a disciplina: ao salvar de novo, o backend "chutava"
  // a disciplina e as aulas de um professor com 2 matérias trocavam de matéria.
  const [horarios] = await db.query(
    `SELECT h.id, h.id_tdp, tdp.id_turma, tdp.id_disciplina, d.nome AS disciplina,
            h.dia_semana,
            TIME_FORMAT(h.hora_inicio, '%H:%i') AS hora_inicio,
            TIME_FORMAT(h.hora_fim, '%H:%i') AS hora_fim,
            h.sala
       FROM horarios_aula h
       JOIN turma_disciplina_professor tdp ON tdp.id = h.id_tdp
       JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
      WHERE tdp.id_professor = ?
      ORDER BY FIELD(h.dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado'), h.hora_inicio`,
    [prof.id_professor]
  );

  prof.horarios = horarios.map((h) => ({ ...h, dia: DIA_PARA_NUM[h.dia_semana] ?? '' }));
}

// ---------------------------------------------------------------------
// Escrita simples
// ---------------------------------------------------------------------

export async function criar(professor, db = pool) {
  const [resultado] = await db.query(
    'INSERT INTO professores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)',
    [professor.id_usuario, professor.nome, professor.cpf, professor.email, professor.telefone ?? null]
  );
  return resultado.insertId;
}

export async function atualizar(id, campos, db = pool) {
  const sql = montarSet(campos, COLUNAS_EDITAVEIS);
  if (!sql) return;
  await db.query(`UPDATE professores SET ${sql.set} WHERE id_professor = ?`, [...sql.valores, id]);
}

// Quantos registros de histórico dependem do vínculo. As tabelas aulas,
// avaliacoes e tarefas usam ON DELETE CASCADE: apagar o vínculo apagaria
// junto toda a chamada e todas as notas daquela turma/disciplina.
async function contarUsos(idTdp, db) {
  const [[{ usos }]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM aulas      WHERE id_tdp = ?)
          + (SELECT COUNT(*) FROM avaliacoes WHERE id_tdp = ?)
          + (SELECT COUNT(*) FROM tarefas    WHERE id_tdp = ?) AS usos`,
    [idTdp, idTdp, idTdp]
  );
  return Number(usos);
}

// Exclui o professor. Vínculos sem histórico saem junto (e os horários deles,
// por CASCADE); se algum vínculo já tiver aulas/notas/tarefas, recusa.
export async function excluir(id, db = pool) {
  const [vinculos] = await db.query(
    `SELECT tdp.id, t.nome AS turma, d.nome AS disciplina
       FROM turma_disciplina_professor tdp
       JOIN turmas t ON t.id_turma = tdp.id_turma
       JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
      WHERE tdp.id_professor = ?`,
    [id]
  );
  for (const v of vinculos) {
    if ((await contarUsos(v.id, db)) > 0) {
      throw new AppError(
        `Não é possível excluir: ${v.disciplina} na turma ${v.turma} já tem aulas, notas ou tarefas lançadas. ` +
          'Em "Editar", use "Transferir para outro professor" nessa turma e depois exclua.',
        409
      );
    }
  }
  if (vinculos.length) {
    await db.query('DELETE FROM turma_disciplina_professor WHERE id_professor = ?', [id]);
  }
  await db.query('DELETE FROM professores WHERE id_professor = ?', [id]);
}

// ---------------------------------------------------------------------
// Vínculos (turma x disciplina) + horários
// ---------------------------------------------------------------------

// Acha (ou cria) as disciplinas pelo nome e confere se as turmas existem.
// Devolve os pares únicos [{ id_turma, id_disciplina }] + dicionários de nomes.
async function normalizarVinculos(vinculos, db) {
  if (!Array.isArray(vinculos)) throw new AppError('"vinculos" deve ser uma lista.', 400);

  const [discs] = await db.query('SELECT id_disciplina, nome FROM disciplinas');
  const discPorNome = new Map(discs.map((d) => [d.nome.trim().toLowerCase(), d]));
  const discPorId = new Map(discs.map((d) => [Number(d.id_disciplina), d]));

  const pares = new Map();
  for (const v of vinculos) {
    const id_turma = lerIdPositivo(v?.id_turma, 'id_turma');
    let disciplina;

    if (v?.id_disciplina !== undefined && v?.id_disciplina !== null && v?.id_disciplina !== '') {
      disciplina = discPorId.get(lerIdPositivo(v.id_disciplina, 'id_disciplina'));
      if (!disciplina) throw new AppError('Disciplina não encontrada.', 422);
    } else {
      const nome = typeof v?.disciplina === 'string' ? v.disciplina.trim() : '';
      if (!nome) throw new AppError('Escolha a disciplina de cada turma.', 400);
      if (nome.length > 60) throw new AppError('Nome de disciplina muito longo (máx. 60).', 400);
      disciplina = discPorNome.get(nome.toLowerCase());
      if (!disciplina) {
        const [r] = await db.query('INSERT INTO disciplinas (nome) VALUES (?)', [nome]);
        disciplina = { id_disciplina: r.insertId, nome };
        discPorNome.set(nome.toLowerCase(), disciplina);
        discPorId.set(Number(r.insertId), disciplina);
      }
    }

    const id_disciplina = Number(disciplina.id_disciplina);
    pares.set(`${id_turma}-${id_disciplina}`, { id_turma, id_disciplina });
  }

  const idsTurmas = [...new Set([...pares.values()].map((p) => p.id_turma))];
  const turmaPorId = new Map();
  if (idsTurmas.length) {
    const [turmas] = await db.query('SELECT id_turma, nome FROM turmas WHERE id_turma IN (?)', [idsTurmas]);
    turmas.forEach((t) => turmaPorId.set(Number(t.id_turma), t.nome));
    const faltando = idsTurmas.filter((id) => !turmaPorId.has(id));
    if (faltando.length) throw new AppError('Uma das turmas escolhidas não existe mais.', 422);
  }

  return { pares: [...pares.values()], discPorNome, discPorId, turmaPorId };
}

export async function sincronizarVinculosEHorarios(idProfessor, { vinculos = [], horarios = [] }, db = pool) {
  const { pares, discPorNome, discPorId, turmaPorId } = await normalizarVinculos(vinculos, db);
  const nomeDisc = (id) => discPorId.get(Number(id))?.nome ?? 'disciplina';
  const chave = (t, d) => `${Number(t)}-${Number(d)}`;

  const [atuais] = await db.query(
    `SELECT tdp.id, tdp.id_turma, tdp.id_disciplina, t.nome AS turma
       FROM turma_disciplina_professor tdp
       JOIN turmas t ON t.id_turma = tdp.id_turma
      WHERE tdp.id_professor = ?`,
    [idProfessor]
  );
  const mapaAtuais = new Map(atuais.map((a) => [chave(a.id_turma, a.id_disciplina), a]));
  const chavesDesejadas = new Set(pares.map((p) => chave(p.id_turma, p.id_disciplina)));

  // 1. Pares novos não podem ser de outro professor (UNIQUE turma+disciplina).
  //    Antes o erro era genérico e a tela fechava sem mostrar o motivo.
  for (const p of pares) {
    if (mapaAtuais.has(chave(p.id_turma, p.id_disciplina))) continue;
    const [[dono]] = await db.query(
      `SELECT p.nome FROM turma_disciplina_professor tdp
         JOIN professores p ON p.id_professor = tdp.id_professor
        WHERE tdp.id_turma = ? AND tdp.id_disciplina = ? AND tdp.id_professor <> ?`,
      [p.id_turma, p.id_disciplina, idProfessor]
    );
    if (dono) {
      throw new AppError(
        `${nomeDisc(p.id_disciplina)} na turma ${turmaPorId.get(p.id_turma)} já é do(a) professor(a) ${dono.nome}. ` +
          'Retire essa disciplina do outro professor antes de atribuí-la.',
        409
      );
    }
  }

  // 2. Vínculos desmarcados: só remove se não houver histórico (senão o
  //    CASCADE apagaria chamadas e notas sem ninguém perceber).
  for (const a of atuais) {
    if (chavesDesejadas.has(chave(a.id_turma, a.id_disciplina))) continue;
    if ((await contarUsos(a.id, db)) > 0) {
      throw new AppError(
        `Não é possível tirar ${nomeDisc(a.id_disciplina)} da turma ${a.turma}: já existem aulas, notas ou tarefas lançadas. ` +
          'Use "Transferir para outro professor".',
        409
      );
    }
    await db.query('DELETE FROM turma_disciplina_professor WHERE id = ?', [a.id]);
  }

  // 3. Insere os novos e monta o mapa turma-disciplina -> id_tdp
  const mapaTdp = new Map();
  for (const p of pares) {
    const k = chave(p.id_turma, p.id_disciplina);
    let idTdp = mapaAtuais.get(k)?.id;
    if (!idTdp) {
      const [r] = await db.query(
        'INSERT INTO turma_disciplina_professor (id_turma, id_disciplina, id_professor) VALUES (?, ?, ?)',
        [p.id_turma, p.id_disciplina, idProfessor]
      );
      idTdp = r.insertId;
    }
    mapaTdp.set(k, idTdp);
  }

  await sincronizarHorarios(idProfessor, horarios, { mapaTdp, discPorNome, nomeDisc, turmaPorId, chave }, db);
}

async function sincronizarHorarios(idProfessor, horarios, ctx, db) {
  if (!Array.isArray(horarios)) throw new AppError('"horarios" deve ser uma lista.', 400);
  const { mapaTdp, discPorNome, nomeDisc, turmaPorId, chave } = ctx;

  // 1. Normaliza e valida cada horário
  const desejados = [];
  for (const h of horarios) {
    const id_turma = lerIdPositivo(h?.id_turma ?? h?.turma ?? h?.turmas?.[0], 'id_turma do horário');
    const id_disciplina =
      h?.id_disciplina ?? discPorNome.get(String(h?.disciplina ?? '').trim().toLowerCase())?.id_disciplina;

    const dia_semana = NUM_PARA_DIA[String(h?.dia)] ?? (DIAS.includes(h?.dia_semana) ? h.dia_semana : null);
    if (!dia_semana) throw new AppError('Escolha o dia da semana de cada horário.', 400);

    const inicio = lerHora(h?.hora_inicio ?? h?.hora, 'hora_inicio');
    const fim = h?.hora_fim ? lerHora(h.hora_fim, 'hora_fim') : deMinutos(paraMinutos(inicio) + DURACAO_PADRAO);
    if (paraMinutos(fim) <= paraMinutos(inicio)) {
      throw new AppError(`O horário das ${inicio} termina antes de começar.`, 400);
    }

    const idTdp = id_disciplina ? mapaTdp.get(chave(id_turma, id_disciplina)) : undefined;
    if (!idTdp) {
      // Antes o backend "chutava" um vínculo qualquer da turma; agora avisa.
      throw new AppError(
        `O horário de ${dia_semana} às ${inicio} é de uma turma/disciplina que não está na lista de aulas do professor.`,
        422
      );
    }

    let sala;
    if (h?.sala !== undefined) {
      sala = typeof h.sala === 'string' && h.sala.trim() ? h.sala.trim().slice(0, 30) : null;
    }

    desejados.push({ idTdp, id_turma, id_disciplina: Number(id_disciplina), dia_semana, inicio, fim, sala });
  }

  // 2. O professor não pode estar em duas aulas ao mesmo tempo
  for (let i = 0; i < desejados.length; i++) {
    for (let j = i + 1; j < desejados.length; j++) {
      const a = desejados[i];
      const b = desejados[j];
      if (
        a.dia_semana === b.dia_semana &&
        paraMinutos(a.inicio) < paraMinutos(b.fim) &&
        paraMinutos(b.inicio) < paraMinutos(a.fim)
      ) {
        throw new AppError(`Há duas aulas do professor na ${a.dia_semana} às ${a.inicio}. Remova a repetida.`, 409);
      }
    }
  }

  // 3. A turma não pode ter outra aula (de outro professor) no mesmo horário.
  //    Antes nada impedia: a 3A ficava com duas matérias na segunda às 07:00.
  for (const h of desejados) {
    const [[choque]] = await db.query(
      `SELECT d.nome AS disciplina, p.nome AS professor,
              TIME_FORMAT(x.hora_inicio, '%H:%i') AS inicio, TIME_FORMAT(x.hora_fim, '%H:%i') AS fim
         FROM horarios_aula x
         JOIN turma_disciplina_professor tdp ON tdp.id = x.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         JOIN professores p ON p.id_professor = tdp.id_professor
        WHERE tdp.id_turma = ? AND tdp.id_professor <> ?
          AND x.dia_semana = ? AND x.hora_inicio < ? AND x.hora_fim > ?
        LIMIT 1`,
      [h.id_turma, idProfessor, h.dia_semana, h.fim, h.inicio]
    );
    if (choque) {
      throw new AppError(
        `A turma ${turmaPorId.get(h.id_turma)} já tem ${choque.disciplina} (${choque.professor}) na ` +
          `${h.dia_semana} das ${choque.inicio} às ${choque.fim}. Escolha outro horário para ${nomeDisc(h.id_disciplina)}.`,
        409
      );
    }
  }

  // 4. Sincroniza por diferença: mantém as linhas que continuam iguais (o id
  //    não muda, e a chamada já feita naquele horário continua ligada a ele),
  //    apaga só as removidas e insere só as novas. Antes TODAS eram apagadas e
  //    recriadas a cada "Salvar", desligando as chamadas (aulas.id_horario = NULL)
  //    e apagando a sala ("Sala 3A", "Quadra").
  const [existentes] = await db.query(
    `SELECT h.id, h.id_tdp, h.dia_semana, TIME_FORMAT(h.hora_inicio, '%H:%i') AS inicio,
            TIME_FORMAT(h.hora_fim, '%H:%i') AS fim, h.sala
       FROM horarios_aula h
       JOIN turma_disciplina_professor tdp ON tdp.id = h.id_tdp
      WHERE tdp.id_professor = ?`,
    [idProfessor]
  );
  const chaveH = (idTdp, dia, inicio) => `${idTdp}|${dia}|${inicio}`;
  const mapaExistentes = new Map(existentes.map((e) => [chaveH(e.id_tdp, e.dia_semana, e.inicio), e]));
  const chavesDesejadas = new Set(desejados.map((d) => chaveH(d.idTdp, d.dia_semana, d.inicio)));

  for (const e of existentes) {
    if (!chavesDesejadas.has(chaveH(e.id_tdp, e.dia_semana, e.inicio))) {
      await db.query('DELETE FROM horarios_aula WHERE id = ?', [e.id]);
    }
  }

  for (const d of desejados) {
    const existente = mapaExistentes.get(chaveH(d.idTdp, d.dia_semana, d.inicio));
    const sala = d.sala === undefined ? existente?.sala ?? null : d.sala;
    if (existente) {
      if (existente.fim !== d.fim || (existente.sala ?? null) !== sala) {
        await db.query('UPDATE horarios_aula SET hora_fim = ?, sala = ? WHERE id = ?', [d.fim, sala, existente.id]);
      }
    } else {
      await db.query(
        'INSERT INTO horarios_aula (id_tdp, dia_semana, hora_inicio, hora_fim, sala) VALUES (?, ?, ?, ?, ?)',
        [d.idTdp, d.dia_semana, d.inicio, d.fim, sala]
      );
    }
  }
}

// ---------------------------------------------------------------------
// Transferência de uma turma/disciplina para outro professor
// ---------------------------------------------------------------------
// Troca só o dono do vínculo (turma_disciplina_professor.id_professor).
// Aulas, chamadas, avaliações, notas e tarefas ficam presas ao vínculo,
// então continuam todas lá e passam a aparecer para o professor novo.
// Os horários (horarios_aula) também vão junto.
export async function transferirVinculo(idOrigem, idTdp, idDestino, db = pool) {
  const [[vinculo]] = await db.query(
    `SELECT tdp.id, tdp.id_professor, t.nome AS turma, d.nome AS disciplina
       FROM turma_disciplina_professor tdp
       JOIN turmas t ON t.id_turma = tdp.id_turma
       JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
      WHERE tdp.id = ?
      FOR UPDATE`,
    [idTdp]
  );
  if (!vinculo || Number(vinculo.id_professor) !== Number(idOrigem)) {
    throw new AppError('Essa turma/disciplina não pertence a este professor.', 404);
  }
  if (Number(idOrigem) === Number(idDestino)) {
    throw new AppError('Escolha outro professor para receber a turma.', 400);
  }

  const [[destino]] = await db.query('SELECT id_professor, nome FROM professores WHERE id_professor = ?', [idDestino]);
  if (!destino) throw new AppError('Professor de destino não encontrado.', 404);

  // O professor novo não pode ter outra aula no mesmo dia e horário
  const [[choque]] = await db.query(
    `SELECT h.dia_semana, TIME_FORMAT(h.hora_inicio, '%H:%i') AS inicio,
            t.nome AS turma, d.nome AS disciplina
       FROM horarios_aula h
       JOIN horarios_aula o ON o.dia_semana = h.dia_semana
                           AND o.hora_inicio < h.hora_fim AND o.hora_fim > h.hora_inicio
       JOIN turma_disciplina_professor x ON x.id = o.id_tdp
       JOIN turmas t ON t.id_turma = x.id_turma
       JOIN disciplinas d ON d.id_disciplina = x.id_disciplina
      WHERE h.id_tdp = ? AND x.id_professor = ?
      LIMIT 1`,
    [idTdp, idDestino]
  );
  if (choque) {
    throw new AppError(
      `${destino.nome} já tem ${choque.disciplina} na turma ${choque.turma} na ${choque.dia_semana} às ${choque.inicio}, ` +
        `no mesmo horário de ${vinculo.disciplina} (${vinculo.turma}). Ajuste os horários antes de transferir.`,
      409
    );
  }

  await db.query('UPDATE turma_disciplina_professor SET id_professor = ? WHERE id = ?', [idDestino, idTdp]);
  return { turma: vinculo.turma, disciplina: vinculo.disciplina, professor: destino.nome };
}
