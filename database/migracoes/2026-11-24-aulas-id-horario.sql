-- =====================================================================
-- Migração: aulas.id_horario (chamada separada por horário)
--
-- Antes, a chamada guardava UMA aula por (turma-disciplina, data). Em
-- aula dupla no mesmo dia (ex.: Ed. Física de quarta), salvar a 2ª aula
-- apagava a chamada da 1ª. Agora cada aula aponta para o horário da grade.
--
-- Rode UMA vez em bancos que já existiam antes desta mudança:
--   mysql -u root -p edutrackpro < database/migracoes/2026-11-24-aulas-id-horario.sql
-- Bancos novos já nascem com a coluna (database/init/01-edutrackpro.sql).
--
-- As aulas antigas ficam com id_horario NULL. Na primeira vez que o
-- professor salvar a chamada de um horário naquele dia, o sistema
-- reaproveita essa aula antiga e preenche o id_horario.
-- =====================================================================

USE edutrackpro;

ALTER TABLE aulas
  ADD COLUMN id_horario INT UNSIGNED NULL AFTER id_tdp,
  ADD UNIQUE KEY uq_aula_horario (id_tdp, data, id_horario),
  ADD CONSTRAINT fk_aula_horario FOREIGN KEY (id_horario) REFERENCES horarios_aula (id) ON DELETE SET NULL;
