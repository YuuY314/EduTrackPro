// =====================================================================
// models/aulas.model.js
// SQL de aulas dadas e da chamada (frequências).
// Uma "aula" é um registro de que a disciplina X foi dada na data Y.
// A "frequência" diz, para cada aluno, se estava presente naquela aula.
// =====================================================================

export function criarAulasModel({ pool }) {
  return {
    async criar({ id_tdp, data, conteudo }) {
      const [r] = await pool.execute(
        "INSERT INTO aulas (id_tdp, data, conteudo) VALUES (?, ?, ?)",
        [id_tdp, data, conteudo ?? null]
      );
      return r.insertId;
    },

    async buscarPorId(idAula) {
      const [linhas] = await pool.execute(
        `SELECT au.id_aula, au.id_tdp, au.data, au.conteudo,
                tdp.id_turma, d.nome AS disciplina
         FROM aulas au
         JOIN turma_disciplina_professor tdp ON tdp.id = au.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         WHERE au.id_aula = ?`,
        [idAula]
      );
      return linhas[0] || null;
    },

    // Filtros opcionais (mesma técnica do avaliacoes.model).
    async listar({ idTurma, idTdp, data, idProfessor }) {
      const condicoes = [];
      const params = [];
      if (idTurma) { condicoes.push("tdp.id_turma = ?"); params.push(idTurma); }
      if (idTdp) { condicoes.push("au.id_tdp = ?"); params.push(idTdp); }
      if (data) { condicoes.push("au.data = ?"); params.push(data); }
      if (idProfessor) { condicoes.push("tdp.id_professor = ?"); params.push(idProfessor); }
      const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

      const [linhas] = await pool.execute(
        `SELECT au.id_aula, au.id_tdp, au.data, au.conteudo,
                tdp.id_turma, t.nome AS turma, d.nome AS disciplina
         FROM aulas au
         JOIN turma_disciplina_professor tdp ON tdp.id = au.id_tdp
         JOIN turmas t ON t.id_turma = tdp.id_turma
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         ${where}
         ORDER BY au.data DESC, au.id_aula DESC`,
        params
      );
      return linhas;
    },

    // Tela de chamada: todos os alunos da turma e a situação de cada um.
    // presente = NULL significa "chamada ainda não feita para este aluno".
    async listarFrequencias(idAula) {
      const [linhas] = await pool.execute(
        `SELECT a.id_aluno, a.nome, f.presente, f.justificativa
         FROM aulas au
         JOIN turma_disciplina_professor tdp ON tdp.id = au.id_tdp
         JOIN alunos a ON a.id_turma = tdp.id_turma
         LEFT JOIN frequencias f ON f.id_aula = au.id_aula AND f.id_aluno = a.id_aluno
         WHERE au.id_aula = ?
         ORDER BY a.nome`,
        [idAula]
      );
      return linhas;
    },

    // Chamada em lote (upsert: refazer a chamada corrige os registros).
    async salvarFrequencias(idAula, lista) {
      const linhas = lista.map((f) => [
        idAula,
        f.id_aluno,
        f.presente ? 1 : 0, // boolean do JSON -> 1/0 do MySQL
        f.justificativa ?? null,
      ]);
      await pool.query(
        `INSERT INTO frequencias (id_aula, id_aluno, presente, justificativa) VALUES ?
         ON DUPLICATE KEY UPDATE presente = VALUES(presente),
                                 justificativa = VALUES(justificativa)`,
        [linhas]
      );
    },

    // Marca/ajusta a presença de UM aluno.
    async salvarFrequencia(idAula, idAluno, presente, justificativa) {
      await pool.execute(
        `INSERT INTO frequencias (id_aula, id_aluno, presente, justificativa) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE presente = VALUES(presente),
                                 justificativa = VALUES(justificativa)`,
        [idAula, idAluno, presente ? 1 : 0, justificativa ?? null]
      );
    },
  };
}
