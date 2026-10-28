// =====================================================================
// models/disciplinas.model.js
// SQL do catálogo de disciplinas (Matemática, Física...).
// =====================================================================

export function criarDisciplinasModel({ pool }) {
  return {
    async listar() {
      const [linhas] = await pool.execute(
        "SELECT id_disciplina, nome FROM disciplinas ORDER BY nome"
      );
      return linhas;
    },

    async buscarPorId(id) {
      const [linhas] = await pool.execute(
        "SELECT id_disciplina, nome FROM disciplinas WHERE id_disciplina = ?",
        [id]
      );
      return linhas[0] || null;
    },

    async criar(nome) {
      const [r] = await pool.execute("INSERT INTO disciplinas (nome) VALUES (?)", [nome]);
      return r.insertId;
    },

    async atualizar(id, nome) {
      await pool.execute("UPDATE disciplinas SET nome = ? WHERE id_disciplina = ?", [nome, id]);
    },

    async remover(id) {
      await pool.execute("DELETE FROM disciplinas WHERE id_disciplina = ?", [id]);
    },
  };
}
