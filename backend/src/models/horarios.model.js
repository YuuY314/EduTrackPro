// =====================================================================
// models/horarios.model.js
// SQL da tabela horarios_aula (o cronograma semanal).
// O horário é ligado ao tdp, então cada turma tem seu cronograma e o
// professor/aluno apenas "enxergam" o da(s) turma(s) deles.
// =====================================================================

import { montarSet } from "../utils/sql.js";

export function criarHorariosModel({ pool }) {
  return {
    // Cronograma da turma. Ordenar por dia_semana funciona porque ENUM
    // ordena pela ORDEM DE DECLARAÇÃO (Segunda, Terça, ...) e não por letra.
    async listarPorTurma(idTurma) {
      const [linhas] = await pool.execute(
        `SELECT h.id, h.id_tdp, h.dia_semana, h.hora_inicio, h.hora_fim, h.sala,
                d.nome AS disciplina, p.nome AS professor
         FROM horarios_aula h
         JOIN turma_disciplina_professor tdp ON tdp.id = h.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         JOIN professores p ON p.id_professor = tdp.id_professor
         WHERE tdp.id_turma = ?
         ORDER BY h.dia_semana, h.hora_inicio`,
        [idTurma]
      );
      return linhas;
    },

    // Agenda do professor (todas as turmas dele misturadas).
    async listarPorProfessor(idProfessor) {
      const [linhas] = await pool.execute(
        `SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fim, h.sala,
                d.nome AS disciplina, t.nome AS turma
         FROM horarios_aula h
         JOIN turma_disciplina_professor tdp ON tdp.id = h.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         JOIN turmas t ON t.id_turma = tdp.id_turma
         WHERE tdp.id_professor = ?
         ORDER BY h.dia_semana, h.hora_inicio`,
        [idProfessor]
      );
      return linhas;
    },

    async buscarPorId(idHorario) {
      const [linhas] = await pool.execute(
        "SELECT id, id_tdp, dia_semana, hora_inicio, hora_fim, sala FROM horarios_aula WHERE id = ?",
        [idHorario]
      );
      return linhas[0] || null;
    },

    async criar({ id_tdp, dia_semana, hora_inicio, hora_fim, sala }) {
      const [r] = await pool.execute(
        `INSERT INTO horarios_aula (id_tdp, dia_semana, hora_inicio, hora_fim, sala)
         VALUES (?, ?, ?, ?, ?)`,
        [id_tdp, dia_semana, hora_inicio, hora_fim, sala ?? null]
      );
      return r.insertId;
    },

    async atualizar(idHorario, campos) {
      const parte = montarSet(campos, ["dia_semana", "hora_inicio", "hora_fim", "sala"]);
      if (!parte) return;
      await pool.execute(`UPDATE horarios_aula SET ${parte.set} WHERE id = ?`, [
        ...parte.valores,
        idHorario,
      ]);
    },

    async remover(idHorario) {
      await pool.execute("DELETE FROM horarios_aula WHERE id = ?", [idHorario]);
    },
  };
}
