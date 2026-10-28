// =====================================================================
// models/tarefas.model.js
// SQL de tarefas passadas pelos professores.
// =====================================================================

import { montarSet } from "../utils/sql.js";

export function criarTarefasModel({ pool }) {
  return {
    async criar({ id_tdp, titulo, descricao, data_entrega }) {
      const [r] = await pool.execute(
        "INSERT INTO tarefas (id_tdp, titulo, descricao, data_entrega) VALUES (?, ?, ?, ?)",
        [id_tdp, titulo, descricao ?? null, data_entrega]
      );
      return r.insertId;
    },

    async buscarPorId(idTarefa) {
      const [linhas] = await pool.execute(
        `SELECT ta.id_tarefa, ta.id_tdp, ta.titulo, ta.descricao, ta.data_entrega,
                tdp.id_turma
         FROM tarefas ta
         JOIN turma_disciplina_professor tdp ON tdp.id = ta.id_tdp
         WHERE ta.id_tarefa = ?`,
        [idTarefa]
      );
      return linhas[0] || null;
    },

    // Tarefas de uma turma, da entrega mais próxima para a mais distante.
    // Usada pelo aluno (/alunos/me/tarefas) e pela lista do professor.
    async listarPorTurma(idTurma, idProfessor = null) {
      const filtroProfessor = idProfessor ? "AND tdp.id_professor = ?" : "";
      const params = idProfessor ? [idTurma, idProfessor] : [idTurma];

      const [linhas] = await pool.execute(
        `SELECT ta.id_tarefa, ta.id_tdp, ta.titulo, ta.descricao, ta.data_entrega,
                d.nome AS disciplina
         FROM tarefas ta
         JOIN turma_disciplina_professor tdp ON tdp.id = ta.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         WHERE tdp.id_turma = ? ${filtroProfessor}
         ORDER BY ta.data_entrega`,
        params
      );
      return linhas;
    },

    async atualizar(idTarefa, campos) {
      const parte = montarSet(campos, ["titulo", "descricao", "data_entrega"]);
      if (!parte) return;
      await pool.execute(`UPDATE tarefas SET ${parte.set} WHERE id_tarefa = ?`, [
        ...parte.valores,
        idTarefa,
      ]);
    },

    async remover(idTarefa) {
      await pool.execute("DELETE FROM tarefas WHERE id_tarefa = ?", [idTarefa]);
    },
  };
}
