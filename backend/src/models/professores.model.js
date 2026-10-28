// =====================================================================
// models/professores.model.js
// SQL de professores. As turmas/horários do professor ficam em
// turmas.model.js e horarios.model.js (consultas por id_professor).
// =====================================================================

import { comTransacao } from "../config/database.js";
import { montarSet } from "../utils/sql.js";

export function criarProfessoresModel({ pool }) {
  return {
    async listar() {
      const [linhas] = await pool.execute(
        "SELECT id_professor, nome, email, telefone FROM professores ORDER BY nome"
      );
      return linhas;
    },

    async buscarPorId(idProfessor) {
      const [linhas] = await pool.execute(
        "SELECT id_professor, id_usuario, nome, cpf, email, telefone FROM professores WHERE id_professor = ?",
        [idProfessor]
      );
      return linhas[0] || null;
    },

    // Cria login (usuarios) + professor numa transação.
    async criar({ nome, cpf, email, telefone, senhaHash }) {
      return comTransacao(pool, async (conn) => {
        const [u] = await conn.execute(
          "INSERT INTO usuarios (email, senha_hash, perfil) VALUES (?, ?, 'professor')",
          [email, senhaHash]
        );
        const [p] = await conn.execute(
          "INSERT INTO professores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)",
          [u.insertId, nome, cpf, email, telefone ?? null]
        );
        return p.insertId;
      });
    },

    async atualizar(idProfessor, campos) {
      const parte = montarSet(campos, ["nome", "cpf", "telefone"]);
      if (!parte) return;
      await pool.execute(`UPDATE professores SET ${parte.set} WHERE id_professor = ?`, [
        ...parte.valores,
        idProfessor,
      ]);
    },

    // Se o professor ainda dá aula em alguma turma, o banco recusa
    // (chave estrangeira) e o tratarErros devolve 409.
    async remover(idProfessor) {
      return comTransacao(pool, async (conn) => {
        const [linhas] = await conn.execute(
          "SELECT id_usuario FROM professores WHERE id_professor = ?",
          [idProfessor]
        );
        if (linhas.length === 0) return;
        await conn.execute("DELETE FROM professores WHERE id_professor = ?", [idProfessor]);
        await conn.execute("DELETE FROM usuarios WHERE id_usuario = ?", [linhas[0].id_usuario]);
      });
    },
  };
}
