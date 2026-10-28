// =====================================================================
// models/turmas.model.js
// SQL de turmas e da tabela turma_disciplina_professor (apelidada "tdp"):
// ela diz QUEM dá QUAL disciplina em QUAL turma. É o coração do sistema:
// horários, aulas, avaliações e tarefas são todos ligados a um tdp.
// =====================================================================

import { montarSet } from "../utils/sql.js";

export function criarTurmasModel({ pool }) {
  return {
    // ---------------------------- turmas ----------------------------
    async listarTodas() {
      const [linhas] = await pool.execute(
        `SELECT t.id_turma, t.nome, t.periodo, t.ano_letivo,
                (SELECT COUNT(*) FROM alunos a WHERE a.id_turma = t.id_turma) AS total_alunos
         FROM turmas t
         ORDER BY t.ano_letivo DESC, t.nome`
      );
      return linhas;
    },

    // Turmas de um professor. Vem UMA LINHA POR DISCIPLINA que ele dá
    // (se ele dá 2 matérias na 3A, a 3A aparece 2 vezes). O service agrupa.
    async listarDoProfessor(idProfessor) {
      const [linhas] = await pool.execute(
        `SELECT t.id_turma, t.nome, t.periodo, t.ano_letivo,
                tdp.id AS id_tdp, d.nome AS disciplina
         FROM turma_disciplina_professor tdp
         JOIN turmas t      ON t.id_turma = tdp.id_turma
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         WHERE tdp.id_professor = ?
         ORDER BY t.nome, d.nome`,
        [idProfessor]
      );
      return linhas;
    },

    async buscarPorId(idTurma) {
      const [linhas] = await pool.execute(
        "SELECT id_turma, nome, periodo, ano_letivo FROM turmas WHERE id_turma = ?",
        [idTurma]
      );
      return linhas[0] || null;
    },

    async criar({ nome, periodo, ano_letivo }) {
      const [r] = await pool.execute(
        "INSERT INTO turmas (nome, periodo, ano_letivo) VALUES (?, ?, ?)",
        [nome, periodo, ano_letivo]
      );
      return r.insertId; // id gerado pelo AUTO_INCREMENT
    },

    async atualizar(idTurma, campos) {
      const parte = montarSet(campos, ["nome", "periodo", "ano_letivo"]);
      if (!parte) return;
      await pool.execute(`UPDATE turmas SET ${parte.set} WHERE id_turma = ?`, [
        ...parte.valores,
        idTurma,
      ]);
    },

    async remover(idTurma) {
      await pool.execute("DELETE FROM turmas WHERE id_turma = ?", [idTurma]);
    },

    // ------------------- tdp (disciplina + professor) -------------------
    async buscarTdp(idTdp) {
      const [linhas] = await pool.execute(
        "SELECT id, id_turma, id_disciplina, id_professor FROM turma_disciplina_professor WHERE id = ?",
        [idTdp]
      );
      return linhas[0] || null;
    },

    async listarDisciplinasDaTurma(idTurma) {
      const [linhas] = await pool.execute(
        `SELECT tdp.id AS id_tdp, d.id_disciplina, d.nome AS disciplina,
                p.id_professor, p.nome AS professor
         FROM turma_disciplina_professor tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         JOIN professores p ON p.id_professor = tdp.id_professor
         WHERE tdp.id_turma = ?
         ORDER BY d.nome`,
        [idTurma]
      );
      return linhas;
    },

    async atribuirDisciplina(idTurma, idDisciplina, idProfessor) {
      const [r] = await pool.execute(
        "INSERT INTO turma_disciplina_professor (id_turma, id_disciplina, id_professor) VALUES (?, ?, ?)",
        [idTurma, idDisciplina, idProfessor]
      );
      return r.insertId;
    },

    async removerTdp(idTdp) {
      await pool.execute("DELETE FROM turma_disciplina_professor WHERE id = ?", [idTdp]);
    },

    // ----------------- perguntas de permissão (sim/não) -----------------
    // "SELECT 1 ... LIMIT 1": só queremos saber se EXISTE alguma linha.

    // Esse professor dá alguma aula nessa turma?
    async professorLecionaNaTurma(idProfessor, idTurma) {
      const [linhas] = await pool.execute(
        `SELECT 1 FROM turma_disciplina_professor
         WHERE id_professor = ? AND id_turma = ? LIMIT 1`,
        [idProfessor, idTurma]
      );
      return linhas.length > 0;
    },

    // Esse professor é o responsável por esse tdp específico?
    async professorDonoDoTdp(idProfessor, idTdp) {
      const [linhas] = await pool.execute(
        "SELECT 1 FROM turma_disciplina_professor WHERE id = ? AND id_professor = ? LIMIT 1",
        [idTdp, idProfessor]
      );
      return linhas.length > 0;
    },
  };
}
