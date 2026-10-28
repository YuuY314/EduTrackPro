// =====================================================================
// models/avaliacoes.model.js
// SQL de avaliações (provas, trabalhos) e das notas lançadas nelas.
// =====================================================================

import { montarSet } from "../utils/sql.js";

export function criarAvaliacoesModel({ pool }) {
  return {
    async criar({ id_tdp, titulo, bimestre, peso, data }) {
      const [r] = await pool.execute(
        "INSERT INTO avaliacoes (id_tdp, titulo, bimestre, peso, data) VALUES (?, ?, ?, ?, ?)",
        [id_tdp, titulo, bimestre, peso ?? 1, data ?? null]
      );
      return r.insertId;
    },

    // Traz junto o id_turma (via tdp) porque os services precisam dele
    // para conferir permissões e a lista de alunos.
    async buscarPorId(idAvaliacao) {
      const [linhas] = await pool.execute(
        `SELECT av.id_avaliacao, av.id_tdp, av.titulo, av.bimestre, av.peso, av.data,
                tdp.id_turma, d.nome AS disciplina
         FROM avaliacoes av
         JOIN turma_disciplina_professor tdp ON tdp.id = av.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         WHERE av.id_avaliacao = ?`,
        [idAvaliacao]
      );
      return linhas[0] || null;
    },

    // Lista com filtros opcionais. Montamos o WHERE aos poucos:
    // só adicionamos uma condição se o filtro foi informado.
    async listar({ idTurma, idTdp, bimestre, idProfessor }) {
      const condicoes = [];
      const params = [];
      if (idTurma) { condicoes.push("tdp.id_turma = ?"); params.push(idTurma); }
      if (idTdp) { condicoes.push("av.id_tdp = ?"); params.push(idTdp); }
      if (bimestre) { condicoes.push("av.bimestre = ?"); params.push(bimestre); }
      if (idProfessor) { condicoes.push("tdp.id_professor = ?"); params.push(idProfessor); }
      const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

      const [linhas] = await pool.execute(
        `SELECT av.id_avaliacao, av.id_tdp, av.titulo, av.bimestre, av.peso, av.data,
                tdp.id_turma, t.nome AS turma, d.nome AS disciplina
         FROM avaliacoes av
         JOIN turma_disciplina_professor tdp ON tdp.id = av.id_tdp
         JOIN turmas t ON t.id_turma = tdp.id_turma
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         ${where}
         ORDER BY av.bimestre, av.data`,
        params
      );
      return linhas;
    },

    async atualizar(idAvaliacao, campos) {
      const parte = montarSet(campos, ["titulo", "bimestre", "peso", "data"]);
      if (!parte) return;
      await pool.execute(`UPDATE avaliacoes SET ${parte.set} WHERE id_avaliacao = ?`, [
        ...parte.valores,
        idAvaliacao,
      ]);
    },

    // As notas dessa avaliação somem junto (ON DELETE CASCADE).
    async remover(idAvaliacao) {
      await pool.execute("DELETE FROM avaliacoes WHERE id_avaliacao = ?", [idAvaliacao]);
    },

    // Tela de lançamento: TODOS os alunos da turma, com a nota (ou NULL
    // se ainda não lançada).
    async listarNotas(idAvaliacao) {
      const [linhas] = await pool.execute(
        `SELECT a.id_aluno, a.nome, n.valor
         FROM avaliacoes av
         JOIN turma_disciplina_professor tdp ON tdp.id = av.id_tdp
         JOIN alunos a ON a.id_turma = tdp.id_turma
         LEFT JOIN notas n ON n.id_avaliacao = av.id_avaliacao AND n.id_aluno = a.id_aluno
         WHERE av.id_avaliacao = ?
         ORDER BY a.nome`,
        [idAvaliacao]
      );
      return linhas;
    },

    // "UPSERT" = INSERT, mas se já existir (mesma avaliação + mesmo aluno,
    // garantido pela chave UNIQUE uq_nota) ATUALIZA o valor.
    // Assim "lançar" e "corrigir" nota são a mesma operação.
    async salvarNota(idAvaliacao, idAluno, valor) {
      await pool.execute(
        `INSERT INTO notas (id_avaliacao, id_aluno, valor) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [idAvaliacao, idAluno, valor]
      );
    },

    // Várias notas de uma vez num único INSERT (atômico: entra tudo ou nada).
    // Aqui usamos pool.query (e não execute) porque o formato "VALUES ?"
    // com uma lista de listas só funciona com query.
    async salvarNotasEmLote(idAvaliacao, notas) {
      const linhas = notas.map((n) => [idAvaliacao, n.id_aluno, n.valor]);
      await pool.query(
        `INSERT INTO notas (id_avaliacao, id_aluno, valor) VALUES ?
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [linhas]
      );
    },
  };
}
