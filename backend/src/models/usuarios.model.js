// =====================================================================
// models/usuarios.model.js
// CAMADA MODEL = só conversa com o banco (SQL). Nada de regra de negócio.
//
// Padrão deste projeto ("injeção de dependência"): em vez de importar o
// pool diretamente, o model é uma FUNÇÃO que recebe o pool e devolve um
// objeto com as consultas. Quem monta tudo é o app.js.
//
// Sobre pool.execute(sql, [valores]): os "?" são substituídos pelos
// valores de forma segura (protege contra SQL Injection). Devolve
// [linhas, metadados]; por isso usamos  const [linhas] = await ...
// =====================================================================

export function criarUsuariosModel({ pool }) {
  // Trecho SQL reaproveitado: usuário + (se houver) dados de aluno/professor.
  // LEFT JOIN: o usuário admin não é aluno nem professor e mesmo assim deve aparecer.
  const SELECT_USUARIO = `
    SELECT u.id_usuario, u.email, u.senha_hash, u.perfil,
           a.id_aluno, p.id_professor,
           COALESCE(a.nome, p.nome, 'Secretaria') AS nome
    FROM usuarios u
    LEFT JOIN alunos a      ON a.id_usuario = u.id_usuario
    LEFT JOIN professores p ON p.id_usuario = u.id_usuario`;

  return {
    // Usado no login.
    async buscarPorEmail(email) {
      const [linhas] = await pool.execute(`${SELECT_USUARIO} WHERE u.email = ?`, [email]);
      return linhas[0] || null; // null se não achou
    },

    async buscarPorId(idUsuario) {
      const [linhas] = await pool.execute(`${SELECT_USUARIO} WHERE u.id_usuario = ?`, [idUsuario]);
      return linhas[0] || null;
    },

    async atualizarSenha(idUsuario, novoHash) {
      await pool.execute("UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?", [
        novoHash,
        idUsuario,
      ]);
    },
  };
}
