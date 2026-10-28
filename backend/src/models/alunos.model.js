// =====================================================================
// models/alunos.model.js
// SQL de alunos: cadastro (CRUD), boletim e frequência.
//
// Duas ideias que aparecem várias vezes aqui:
//  - O ALUNO NÃO TEM cronograma/notas/faltas próprios no banco: tudo é
//    derivado da turma dele (cronograma) e de tabelas ligadas (notas,
//    frequências). Por isso as consultas fazem JOIN.
//  - O parâmetro opcional "idProfessor": quando vem preenchido, a consulta
//    mostra só os dados das disciplinas DAQUELE professor (é o que ele
//    pode ver ao "entrar no aluno"). Quando é null, mostra tudo (aluno
//    vendo o próprio boletim, ou admin).
// =====================================================================

import { comTransacao } from "../config/database.js";
import { montarSet } from "../utils/sql.js";

export function criarAlunosModel({ pool }) {
  return {
    // ----------------------------- leitura -----------------------------

    // Ficha completa: aluno + turma + responsável.
    async buscarPorId(idAluno) {
      const [linhas] = await pool.execute(
        `SELECT a.id_aluno, a.id_usuario, a.id_turma, a.matricula, a.nome, a.cpf,
                a.endereco, a.email_institucional,
                t.nome AS turma, t.periodo,
                r.id_responsavel, r.nome AS responsavel_nome, r.cpf AS responsavel_cpf,
                r.telefone AS responsavel_telefone, r.email AS responsavel_email,
                r.parentesco AS responsavel_parentesco
         FROM alunos a
         JOIN turmas t       ON t.id_turma = a.id_turma
         JOIN responsaveis r ON r.id_responsavel = a.id_responsavel
         WHERE a.id_aluno = ?`,
        [idAluno]
      );
      return linhas[0] || null;
    },

    // Lista simples (sem dados sensíveis como CPF) de uma turma.
    async listarPorTurma(idTurma) {
      const [linhas] = await pool.execute(
        `SELECT id_aluno, matricula, nome, email_institucional
         FROM alunos WHERE id_turma = ? ORDER BY nome`,
        [idTurma]
      );
      return linhas;
    },

    async listarTodos() {
      const [linhas] = await pool.execute(
        `SELECT a.id_aluno, a.matricula, a.nome, a.email_institucional,
                a.id_turma, t.nome AS turma
         FROM alunos a JOIN turmas t ON t.id_turma = a.id_turma
         ORDER BY t.nome, a.nome`
      );
      return linhas;
    },

    // ----------------------- boletim e frequência -----------------------

    // Médias ponderadas por disciplina/bimestre, calculadas pela VIEW vw_boletim.
    async boletimMedias(idAluno) {
      const [linhas] = await pool.execute(
        "SELECT disciplina, bimestre, media FROM vw_boletim WHERE id_aluno = ?",
        [idAluno]
      );
      return linhas;
    },

    // Cada avaliação da turma do aluno com a nota dele.
    // LEFT JOIN em notas: se o professor ainda não lançou, valor vem NULL
    // (e a avaliação continua aparecendo no boletim).
    async notasDetalhadas(idAluno, idProfessor = null) {
      const filtroProfessor = idProfessor ? "AND tdp.id_professor = ?" : "";
      const params = idProfessor ? [idAluno, idProfessor] : [idAluno];

      const [linhas] = await pool.execute(
        `SELECT d.nome AS disciplina, av.id_avaliacao, av.titulo, av.bimestre,
                av.peso, av.data, n.valor
         FROM alunos a
         JOIN turma_disciplina_professor tdp ON tdp.id_turma = a.id_turma
         JOIN disciplinas d  ON d.id_disciplina = tdp.id_disciplina
         JOIN avaliacoes av  ON av.id_tdp = tdp.id
         LEFT JOIN notas n   ON n.id_avaliacao = av.id_avaliacao AND n.id_aluno = a.id_aluno
         WHERE a.id_aluno = ? ${filtroProfessor}
         ORDER BY d.nome, av.bimestre, av.data`,
        params
      );
      return linhas;
    },

    // Totais de aulas e faltas, por disciplina.
    // SUM(f.presente = 0) conta quantas linhas têm presente = falso.
    async frequenciaPorDisciplina(idAluno, idProfessor = null) {
      const filtroProfessor = idProfessor ? "AND tdp.id_professor = ?" : "";
      const params = idProfessor ? [idAluno, idProfessor] : [idAluno];

      const [linhas] = await pool.execute(
        `SELECT d.nome AS disciplina,
                COUNT(*) AS total_aulas,
                SUM(f.presente = 0) AS faltas
         FROM frequencias f
         JOIN aulas au ON au.id_aula = f.id_aula
         JOIN turma_disciplina_professor tdp ON tdp.id = au.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         WHERE f.id_aluno = ? ${filtroProfessor}
         GROUP BY d.id_disciplina, d.nome
         ORDER BY d.nome`,
        params
      );
      return linhas;
    },

    // Lista das faltas (data, disciplina e justificativa).
    async listarFaltas(idAluno, idProfessor = null) {
      const filtroProfessor = idProfessor ? "AND tdp.id_professor = ?" : "";
      const params = idProfessor ? [idAluno, idProfessor] : [idAluno];

      const [linhas] = await pool.execute(
        `SELECT au.data, d.nome AS disciplina, f.justificativa
         FROM frequencias f
         JOIN aulas au ON au.id_aula = f.id_aula
         JOIN turma_disciplina_professor tdp ON tdp.id = au.id_tdp
         JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
         WHERE f.id_aluno = ? AND f.presente = 0 ${filtroProfessor}
         ORDER BY au.data DESC`,
        params
      );
      return linhas;
    },

    // ------------------------ escrita (admin) ------------------------

    // Cadastrar um aluno mexe em 3 tabelas (usuarios, responsaveis, alunos),
    // então usamos TRANSAÇÃO: ou grava tudo ou não grava nada.
    async criar({ aluno, idResponsavel, responsavel, senhaHash }) {
      return comTransacao(pool, async (conn) => {
        // 1) cria o login do aluno
        const [u] = await conn.execute(
          "INSERT INTO usuarios (email, senha_hash, perfil) VALUES (?, ?, 'aluno')",
          [aluno.email_institucional, senhaHash]
        );

        // 2) usa um responsável que já existe (irmãos!) ou cria um novo
        let idResp = idResponsavel;
        if (!idResp) {
          const [r] = await conn.execute(
            `INSERT INTO responsaveis (nome, cpf, telefone, email, parentesco)
             VALUES (?, ?, ?, ?, ?)`,
            [
              responsavel.nome,
              responsavel.cpf,
              responsavel.telefone,
              responsavel.email ?? null,
              responsavel.parentesco,
            ]
          );
          idResp = r.insertId;
        }

        // 3) cria o aluno ligando tudo
        const [a] = await conn.execute(
          `INSERT INTO alunos (id_usuario, id_turma, id_responsavel, matricula, nome,
                               cpf, endereco, email_institucional)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            u.insertId,
            aluno.id_turma,
            idResp,
            aluno.matricula,
            aluno.nome,
            aluno.cpf,
            aluno.endereco ?? null,
            aluno.email_institucional,
          ]
        );
        return a.insertId;
      });
    },

    async atualizar(idAluno, campos) {
      const parte = montarSet(campos, ["nome", "cpf", "matricula", "endereco", "id_turma"]);
      if (!parte) return;
      await pool.execute(`UPDATE alunos SET ${parte.set} WHERE id_aluno = ?`, [
        ...parte.valores,
        idAluno,
      ]);
    },

    // Remove o aluno e o login dele. Notas e frequências somem junto
    // (ON DELETE CASCADE definido no banco).
    async remover(idAluno) {
      return comTransacao(pool, async (conn) => {
        const [linhas] = await conn.execute("SELECT id_usuario FROM alunos WHERE id_aluno = ?", [
          idAluno,
        ]);
        if (linhas.length === 0) return;
        await conn.execute("DELETE FROM alunos WHERE id_aluno = ?", [idAluno]);
        await conn.execute("DELETE FROM usuarios WHERE id_usuario = ?", [linhas[0].id_usuario]);
      });
    },
  };
}
