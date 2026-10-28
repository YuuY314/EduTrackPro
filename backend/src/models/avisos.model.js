// =====================================================================
// models/avisos.model.js
// SQL de avisos. Regra da tabela: id_turma NULL = aviso GERAL (todas as
// turmas); id_turma preenchido = aviso só daquela turma.
// =====================================================================

import { montarSet } from "../utils/sql.js";

export function criarAvisosModel({ pool }) {
  // Trecho reaproveitado: aviso + nome de quem publicou.
  // (Admin não está na tabela professores, então COALESCE usa 'Secretaria'.)
  const SELECT_AVISO = `
    SELECT av.id_aviso, av.id_autor, av.id_turma, av.titulo, av.texto, av.data_publicacao,
           COALESCE(p.nome, 'Secretaria') AS autor
    FROM avisos av
    LEFT JOIN professores p ON p.id_usuario = av.id_autor`;

  return {
    async criar({ id_autor, id_turma, titulo, texto }) {
      const [r] = await pool.execute(
        "INSERT INTO avisos (id_autor, id_turma, titulo, texto) VALUES (?, ?, ?, ?)",
        [id_autor, id_turma ?? null, titulo, texto]
      );
      return r.insertId;
    },

    async buscarPorId(idAviso) {
      const [linhas] = await pool.execute(`${SELECT_AVISO} WHERE av.id_aviso = ?`, [idAviso]);
      return linhas[0] || null;
    },

    // O que o ALUNO enxerga: avisos da turma dele + avisos gerais.
    async listarParaTurma(idTurma) {
      const [linhas] = await pool.execute(
        `${SELECT_AVISO}
         WHERE av.id_turma = ? OR av.id_turma IS NULL
         ORDER BY av.data_publicacao DESC`,
        [idTurma]
      );
      return linhas;
    },

    // O que o PROFESSOR enxerga: gerais + avisos das turmas em que ele leciona.
    async listarParaProfessor(idProfessor) {
      const [linhas] = await pool.execute(
        `${SELECT_AVISO}
         WHERE av.id_turma IS NULL
            OR av.id_turma IN (SELECT id_turma FROM turma_disciplina_professor
                               WHERE id_professor = ?)
         ORDER BY av.data_publicacao DESC`,
        [idProfessor]
      );
      return linhas;
    },

    // O ADMIN enxerga tudo (com filtro opcional por turma).
    async listarTodos(idTurma = null) {
      if (idTurma) return this.listarParaTurma(idTurma);
      const [linhas] = await pool.execute(`${SELECT_AVISO} ORDER BY av.data_publicacao DESC`);
      return linhas;
    },

    async atualizar(idAviso, campos) {
      const parte = montarSet(campos, ["titulo", "texto"]);
      if (!parte) return;
      await pool.execute(`UPDATE avisos SET ${parte.set} WHERE id_aviso = ?`, [
        ...parte.valores,
        idAviso,
      ]);
    },

    async remover(idAviso) {
      await pool.execute("DELETE FROM avisos WHERE id_aviso = ?", [idAviso]);
    },
  };
}
