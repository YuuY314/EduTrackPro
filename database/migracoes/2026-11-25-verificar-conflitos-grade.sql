-- =====================================================================
-- Verificação (SÓ LEITURA): dados estragados pelos bugs antigos da tela
-- "Editar professor". Não altera nada; rode e confira o resultado.
--
--   mysql -u root -p edutrackpro < database/migracoes/2026-11-25-verificar-conflitos-grade.sql
--
-- Antes da correção de 25/11/2026 a tela podia:
--   1) colocar duas aulas na MESMA turma no mesmo dia/horário
--      (ex.: professor novo na 3A, segunda 07:00, junto com Português);
--   2) desligar a chamada do horário (aulas.id_horario = NULL), porque
--      apagava e recriava todos os horários a cada "Salvar".
-- =====================================================================

USE edutrackpro;

-- 1) Turmas com duas aulas ao mesmo tempo (deveria voltar vazio)
SELECT t.nome AS turma, a.dia_semana,
       TIME_FORMAT(a.hora_inicio, '%H:%i') AS inicio_1, d1.nome AS disciplina_1, p1.nome AS professor_1,
       TIME_FORMAT(b.hora_inicio, '%H:%i') AS inicio_2, d2.nome AS disciplina_2, p2.nome AS professor_2
  FROM horarios_aula a
  JOIN horarios_aula b ON b.id > a.id AND b.dia_semana = a.dia_semana
                      AND b.hora_inicio < a.hora_fim AND b.hora_fim > a.hora_inicio
  JOIN turma_disciplina_professor ta ON ta.id = a.id_tdp
  JOIN turma_disciplina_professor tb ON tb.id = b.id_tdp AND tb.id_turma = ta.id_turma
  JOIN turmas t       ON t.id_turma = ta.id_turma
  JOIN disciplinas d1 ON d1.id_disciplina = ta.id_disciplina
  JOIN disciplinas d2 ON d2.id_disciplina = tb.id_disciplina
  JOIN professores p1 ON p1.id_professor = ta.id_professor
  JOIN professores p2 ON p2.id_professor = tb.id_professor
 ORDER BY t.nome, a.dia_semana, a.hora_inicio;

-- 2) Professor em duas turmas ao mesmo tempo (deveria voltar vazio)
SELECT p.nome AS professor, a.dia_semana, TIME_FORMAT(a.hora_inicio, '%H:%i') AS inicio,
       t1.nome AS turma_1, t2.nome AS turma_2
  FROM horarios_aula a
  JOIN horarios_aula b ON b.id > a.id AND b.dia_semana = a.dia_semana
                      AND b.hora_inicio < a.hora_fim AND b.hora_fim > a.hora_inicio
  JOIN turma_disciplina_professor ta ON ta.id = a.id_tdp
  JOIN turma_disciplina_professor tb ON tb.id = b.id_tdp AND tb.id_professor = ta.id_professor
  JOIN professores p ON p.id_professor = ta.id_professor
  JOIN turmas t1 ON t1.id_turma = ta.id_turma
  JOIN turmas t2 ON t2.id_turma = tb.id_turma;

-- 3) Chamadas sem horário em dias com AULA DUPLA da mesma disciplina.
--    Nesses dias a tela de chamada não sabe de qual horário é cada uma;
--    confira com o professor e, se precisar, ajuste aulas.id_horario.
--    (Aulas sem horário em dia de aula simples são reaproveitadas sozinhas.)
SELECT au.id_aula, au.data, t.nome AS turma, d.nome AS disciplina,
       (SELECT COUNT(*) FROM horarios_aula h
         WHERE h.id_tdp = au.id_tdp
           AND h.dia_semana = ELT(DAYOFWEEK(au.data), 'Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado')
       ) AS horarios_no_dia
  FROM aulas au
  JOIN turma_disciplina_professor tdp ON tdp.id = au.id_tdp
  JOIN turmas t ON t.id_turma = tdp.id_turma
  JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
 WHERE au.id_horario IS NULL
HAVING horarios_no_dia > 1
 ORDER BY au.data;
