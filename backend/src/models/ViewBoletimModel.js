// =====================================================================
// models/BoletimModel.js - SQL da VIEW "vw_boletim"
//
// Uma view se consulta como uma tabela, mas é SÓ LEITURA: aqui existem
// apenas SELECTs (nada de criar/atualizar/excluir).
// Cada linha da view = 1 aluno + 1 disciplina + 1 bimestre + a média.
// =====================================================================

import { pool } from '../config/database.js';

// O mysql2 devolve DECIMAL como texto ("7.5"). Convertemos para número.
function hidratarViewBoletim(linha) {
  return { ...linha, media: Number(linha.media) };
}

// Lista geral paginada (uso do admin/professor)
export async function listar({ limite, offset }) {
    // LIMIT/OFFSET com "?" exigem query() em vez de execute() no mysql2
    const [linhas] = await pool.query(
        'SELECT * FROM vw_boletim ORDER BY aluno, disciplina, bimestre LIMIT ? OFFSET ?',
        [limite, offset]
    );

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM vw_boletim');

    return { 
        boletim: linhas.map(hidratarViewBoletim), 
        total: Number(total)
    };
}

// Todas as linhas de UM aluno
export async function buscarPorAluno(id_aluno) {
  const [linhas] = await pool.query('SELECT * FROM vw_boletim WHERE id_aluno = ? ORDER BY disciplina, bimestre', [id_aluno]);
  return linhas.map(hidratarViewBoletim);
}