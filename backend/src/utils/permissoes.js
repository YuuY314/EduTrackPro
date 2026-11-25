// =====================================================================
// utils/permissoes.js - regras de "quem pode mexer em quê"
//
// O exigirPerfil() do middleware só sabe o PERFIL (admin, professor...).
// Aqui ficam as conferências que dependem do REGISTRO: um professor só
// pode lançar nota/chamada nas turmas-disciplinas que ele mesmo leciona.
// =====================================================================

import { pool } from '../config/database.js';
import { AppError } from './AppError.js';

// Professor só acessa o próprio vínculo turma-disciplina (id_tdp).
// Admin passa direto. Id inválido é ignorado aqui: o service responde 400.
export async function garantirAcessoTdp(usuario, idTdpRecebido) {
  if (usuario?.perfil !== 'professor') return;

  const idTdp = Number(idTdpRecebido);
  if (!Number.isInteger(idTdp) || idTdp <= 0) return;

  const [linhas] = await pool.query(
    'SELECT id_professor FROM turma_disciplina_professor WHERE id = ?',
    [idTdp]
  );
  if (!linhas[0]) throw new AppError('Turma/disciplina não encontrada.', 404);
  if (Number(linhas[0].id_professor) !== Number(usuario.id_professor)) {
    throw new AppError('Você não leciona nessa turma/disciplina.', 403);
  }
}

// Turma do aluno logado (para filtrar tarefas e avisos). Para admin e
// professor devolve null = sem filtro.
export async function turmaDoAluno(usuario) {
  if (usuario?.perfil !== 'aluno') return null;
  const [linhas] = await pool.query('SELECT id_turma FROM alunos WHERE id_aluno = ?', [usuario.id_aluno]);
  if (!linhas[0]) throw new AppError('Aluno não encontrado.', 404);
  return linhas[0].id_turma;
}

// Todos os alunos enviados precisam ser da turma daquele vínculo.
// Evita lançar nota/presença para aluno de outra turma.
export async function garantirAlunosDaTdp(idTdp, idsAlunos, db = pool) {
  const ids = [...new Set(idsAlunos.map(Number))];
  if (ids.length === 0) return;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
       FROM alunos a
       JOIN turma_disciplina_professor tdp ON tdp.id_turma = a.id_turma
      WHERE tdp.id = ? AND a.id_aluno IN (?)`,
    [idTdp, ids]
  );
  if (Number(total) !== ids.length) {
    throw new AppError('Há alunos na lista que não pertencem a essa turma.', 422);
  }
}

// Editar/excluir um registro que pertence a um vínculo (aula, avaliação, tarefa).
// Antes o professor podia alterar ou apagar registros das turmas de OUTROS
// professores só trocando o id na URL, e "mover" um registro para outro vínculo.
// registroAtual = o que está no banco; idTdpNovo = o id_tdp que veio no corpo.
export async function garantirAcessoRegistro(usuario, registroAtual, idTdpNovo) {
  if (usuario?.perfil !== 'professor') return;
  await garantirAcessoTdp(usuario, registroAtual?.id_tdp);
  if (idTdpNovo !== undefined) await garantirAcessoTdp(usuario, idTdpNovo);
}
