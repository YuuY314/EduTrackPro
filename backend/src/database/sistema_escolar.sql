-- =====================================================================
-- Sistema escolar - MySQL 8.0.16+ (usa CHECK, que só é aplicado a partir daí)
-- Contém: CREATE TABLE + dados de teste (turma 3A, 20 alunos,
--         20 responsáveis, 11 professores, 11 disciplinas do ensino médio)
-- Todos os CPFs, telefones e e-mails são FICTÍCIOS.
-- =====================================================================

-- Garante que os acentos sejam lidos corretamente, qualquer que seja o cliente
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS sistema_escolar;
CREATE DATABASE sistema_escolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_escolar;

-- =====================================================================
-- 1) ESTRUTURA
-- =====================================================================

CREATE TABLE usuarios (
  id_usuario  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(120) NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,
  perfil      ENUM('aluno','professor','admin') NOT NULL,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE turmas (
  id_turma     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome         VARCHAR(10)  NOT NULL,              -- 3A, 3B...
  periodo      ENUM('Manhã','Tarde','Noite') NOT NULL,
  ano_letivo   YEAR NOT NULL,
  PRIMARY KEY (id_turma),
  UNIQUE KEY uq_turma_ano (nome, ano_letivo)
) ENGINE=InnoDB;

CREATE TABLE disciplinas (
  id_disciplina INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(60) NOT NULL,
  PRIMARY KEY (id_disciplina),
  UNIQUE KEY uq_disciplina_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE responsaveis (
  id_responsavel INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome           VARCHAR(120) NOT NULL,
  cpf            CHAR(14)     NOT NULL,            -- 000.000.000-00
  telefone       VARCHAR(20)  NOT NULL,
  email          VARCHAR(120) NULL,
  parentesco     VARCHAR(30)  NOT NULL,            -- Pai, Mãe, Avó...
  PRIMARY KEY (id_responsavel),
  UNIQUE KEY uq_responsavel_cpf (cpf)
) ENGINE=InnoDB;

CREATE TABLE professores (
  id_professor INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario   INT UNSIGNED NOT NULL,
  nome         VARCHAR(120) NOT NULL,
  cpf          CHAR(14)     NOT NULL,
  email        VARCHAR(120) NOT NULL,
  telefone     VARCHAR(20)  NULL,
  PRIMARY KEY (id_professor),
  UNIQUE KEY uq_professor_cpf (cpf),
  UNIQUE KEY uq_professor_usuario (id_usuario),
  CONSTRAINT fk_professor_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE alunos (
  id_aluno            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario          INT UNSIGNED NOT NULL,
  id_turma            INT UNSIGNED NOT NULL,
  id_responsavel      INT UNSIGNED NOT NULL,       -- substitui a tabela aluno_responsavel
  matricula           VARCHAR(20)  NOT NULL,
  nome                VARCHAR(120) NOT NULL,
  cpf                 CHAR(14)     NOT NULL,
  endereco            VARCHAR(200) NULL,
  email_institucional VARCHAR(120) NOT NULL,
  PRIMARY KEY (id_aluno),
  UNIQUE KEY uq_aluno_matricula (matricula),
  UNIQUE KEY uq_aluno_cpf (cpf),
  UNIQUE KEY uq_aluno_usuario (id_usuario),
  KEY idx_aluno_turma (id_turma),
  CONSTRAINT fk_aluno_usuario     FOREIGN KEY (id_usuario)     REFERENCES usuarios (id_usuario),
  CONSTRAINT fk_aluno_turma       FOREIGN KEY (id_turma)       REFERENCES turmas (id_turma),
  CONSTRAINT fk_aluno_responsavel FOREIGN KEY (id_responsavel) REFERENCES responsaveis (id_responsavel)
) ENGINE=InnoDB;

-- tdp: "quem dá qual matéria em qual turma"
CREATE TABLE turma_disciplina_professor (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_turma      INT UNSIGNED NOT NULL,
  id_disciplina INT UNSIGNED NOT NULL,
  id_professor  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tdp (id_turma, id_disciplina),
  KEY idx_tdp_professor (id_professor),
  CONSTRAINT fk_tdp_turma      FOREIGN KEY (id_turma)      REFERENCES turmas (id_turma),
  CONSTRAINT fk_tdp_disciplina FOREIGN KEY (id_disciplina) REFERENCES disciplinas (id_disciplina),
  CONSTRAINT fk_tdp_professor  FOREIGN KEY (id_professor)  REFERENCES professores (id_professor)
) ENGINE=InnoDB;

CREATE TABLE horarios_aula (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tdp      INT UNSIGNED NOT NULL,
  dia_semana  ENUM('Segunda','Terça','Quarta','Quinta','Sexta','Sábado') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim    TIME NOT NULL,
  sala        VARCHAR(30) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_horario (id_tdp, dia_semana, hora_inicio),
  CONSTRAINT fk_horario_tdp FOREIGN KEY (id_tdp) REFERENCES turma_disciplina_professor (id) ON DELETE CASCADE,
  CONSTRAINT ck_horario CHECK (hora_fim > hora_inicio)
) ENGINE=InnoDB;

CREATE TABLE aulas (
  id_aula  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tdp   INT UNSIGNED NOT NULL,
  data     DATE NOT NULL,
  conteudo VARCHAR(255) NULL,
  PRIMARY KEY (id_aula),
  KEY idx_aula_tdp_data (id_tdp, data),
  CONSTRAINT fk_aula_tdp FOREIGN KEY (id_tdp) REFERENCES turma_disciplina_professor (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE frequencias (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_aula       INT UNSIGNED NOT NULL,
  id_aluno      INT UNSIGNED NOT NULL,
  presente      BOOLEAN NOT NULL DEFAULT TRUE,
  justificativa VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_frequencia (id_aula, id_aluno),
  KEY idx_freq_aluno (id_aluno),
  CONSTRAINT fk_freq_aula  FOREIGN KEY (id_aula)  REFERENCES aulas (id_aula)   ON DELETE CASCADE,
  CONSTRAINT fk_freq_aluno FOREIGN KEY (id_aluno) REFERENCES alunos (id_aluno) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE avaliacoes (
  id_avaliacao INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tdp       INT UNSIGNED NOT NULL,
  titulo       VARCHAR(100) NOT NULL,
  bimestre     TINYINT UNSIGNED NOT NULL,
  peso         DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  data         DATE NULL,
  PRIMARY KEY (id_avaliacao),
  KEY idx_aval_tdp (id_tdp),
  CONSTRAINT fk_aval_tdp FOREIGN KEY (id_tdp) REFERENCES turma_disciplina_professor (id) ON DELETE CASCADE,
  CONSTRAINT ck_aval_bimestre CHECK (bimestre BETWEEN 1 AND 4)
) ENGINE=InnoDB;

CREATE TABLE notas (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_avaliacao INT UNSIGNED NOT NULL,
  id_aluno     INT UNSIGNED NOT NULL,
  valor        DECIMAL(4,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nota (id_avaliacao, id_aluno),
  KEY idx_nota_aluno (id_aluno),
  CONSTRAINT fk_nota_aval  FOREIGN KEY (id_avaliacao) REFERENCES avaliacoes (id_avaliacao) ON DELETE CASCADE,
  CONSTRAINT fk_nota_aluno FOREIGN KEY (id_aluno)     REFERENCES alunos (id_aluno)         ON DELETE CASCADE,
  CONSTRAINT ck_nota_valor CHECK (valor BETWEEN 0 AND 10)
) ENGINE=InnoDB;

CREATE TABLE tarefas (
  id_tarefa    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tdp       INT UNSIGNED NOT NULL,
  titulo       VARCHAR(120) NOT NULL,
  descricao    TEXT NULL,
  data_entrega DATE NOT NULL,
  PRIMARY KEY (id_tarefa),
  KEY idx_tarefa_tdp (id_tdp),
  CONSTRAINT fk_tarefa_tdp FOREIGN KEY (id_tdp) REFERENCES turma_disciplina_professor (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE avisos (
  id_aviso         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_autor         INT UNSIGNED NOT NULL,          -- usuário que publicou
  id_turma         INT UNSIGNED NULL,              -- NULL = aviso geral (todas as turmas)
  titulo           VARCHAR(150) NOT NULL,
  texto            TEXT NOT NULL,
  data_publicacao  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_aviso),
  KEY idx_aviso_turma (id_turma),
  CONSTRAINT fk_aviso_autor FOREIGN KEY (id_autor) REFERENCES usuarios (id_usuario),
  CONSTRAINT fk_aviso_turma FOREIGN KEY (id_turma) REFERENCES turmas (id_turma)
) ENGINE=InnoDB;

-- =====================================================================
-- 2) DADOS DE TESTE
-- =====================================================================
-- senha_hash é só um placeholder: no backend, grave o hash real (bcrypt/argon2).

-- ---- usuarios: 1-11 professores | 12-31 alunos | 32 admin ----------
INSERT INTO usuarios (id_usuario, email, senha_hash, perfil) VALUES
(1,  'helena.carvalho@escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(2,  'ricardo.menezes@escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(3,  'fernanda.lopes@escola.edu.br',   '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(4,  'marcelo.tavares@escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(5,  'juliana.prado@escola.edu.br',    '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(6,  'andre.barros@escola.edu.br',     '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(7,  'patricia.nogueira@escola.edu.br','$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(8,  'carlos.silva@escola.edu.br',     '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(9,  'roberto.fonseca@escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(10, 'luciana.azevedo@escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(11, 'gustavo.ribeiro@escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'professor'),
(12, 'ana.souza@aluno.escola.edu.br',      '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(13, 'bruno.lima@aluno.escola.edu.br',     '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(14, 'camila.rocha@aluno.escola.edu.br',   '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(15, 'daniel.pereira@aluno.escola.edu.br', '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(16, 'eduarda.costa@aluno.escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(17, 'felipe.ribeiro@aluno.escola.edu.br', '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(18, 'gabriela.oliveira@aluno.escola.edu.br','$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(19, 'heitor.nunes@aluno.escola.edu.br',   '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(20, 'isabela.dias@aluno.escola.edu.br',   '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(21, 'joao.araujo@aluno.escola.edu.br',    '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(22, 'larissa.teixeira@aluno.escola.edu.br','$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(23, 'lucas.moreira@aluno.escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(24, 'mariana.campos@aluno.escola.edu.br', '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(25, 'matheus.lopes@aluno.escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(26, 'natalia.batista@aluno.escola.edu.br','$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(27, 'pedro.monteiro@aluno.escola.edu.br', '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(28, 'rafaela.pinto@aluno.escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(29, 'rodrigo.farias@aluno.escola.edu.br', '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(30, 'sofia.vieira@aluno.escola.edu.br',   '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(31, 'thiago.borges@aluno.escola.edu.br',  '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'aluno'),
(32, 'secretaria@escola.edu.br',           '$2b$10$HASH_DE_EXEMPLO_TROCAR_NO_BACKEND', 'admin');

-- ---- turma ---------------------------------------------------------
INSERT INTO turmas (id_turma, nome, periodo, ano_letivo) VALUES
(1, '3A', 'Manhã', 2026);

-- ---- disciplinas do ensino médio (11) ------------------------------
INSERT INTO disciplinas (id_disciplina, nome) VALUES
(1,  'Língua Portuguesa'),
(2,  'Matemática'),
(3,  'Física'),
(4,  'Química'),
(5,  'Biologia'),
(6,  'História'),
(7,  'Geografia'),
(8,  'Inglês'),
(9,  'Educação Física'),
(10, 'Filosofia'),
(11, 'Sociologia');

-- ---- professores (11) - um por disciplina ---------------------------
INSERT INTO professores (id_professor, id_usuario, nome, cpf, email, telefone) VALUES
(1,  1,  'Helena Carvalho',        '300.000.001-01', 'helena.carvalho@escola.edu.br',  '(11) 97200-0001'),
(2,  2,  'Ricardo Menezes',        '300.000.002-02', 'ricardo.menezes@escola.edu.br',  '(11) 97200-0002'),
(3,  3,  'Fernanda Lopes',         '300.000.003-03', 'fernanda.lopes@escola.edu.br',   '(11) 97200-0003'),
(4,  4,  'Marcelo Tavares',        '300.000.004-04', 'marcelo.tavares@escola.edu.br',  '(11) 97200-0004'),
(5,  5,  'Juliana Prado',          '300.000.005-05', 'juliana.prado@escola.edu.br',    '(11) 97200-0005'),
(6,  6,  'André Barros',           '300.000.006-06', 'andre.barros@escola.edu.br',     '(11) 97200-0006'),
(7,  7,  'Patrícia Nogueira',      '300.000.007-07', 'patricia.nogueira@escola.edu.br','(11) 97200-0007'),
(8,  8,  'Carlos Eduardo Silva',   '300.000.008-08', 'carlos.silva@escola.edu.br',     '(11) 97200-0008'),
(9,  9,  'Roberto Fonseca',        '300.000.009-09', 'roberto.fonseca@escola.edu.br',  '(11) 97200-0009'),
(10, 10, 'Luciana Azevedo',        '300.000.010-10', 'luciana.azevedo@escola.edu.br',  '(11) 97200-0010'),
(11, 11, 'Gustavo Ribeiro',        '300.000.011-11', 'gustavo.ribeiro@escola.edu.br',  '(11) 97200-0011');

-- ---- responsáveis (20) ---------------------------------------------
INSERT INTO responsaveis (id_responsavel, nome, cpf, telefone, email, parentesco) VALUES
(1,  'Marcos Souza',       '200.000.001-01', '(11) 98100-0001', 'marcos.souza@email.com',      'Pai'),
(2,  'Patrícia Lima',      '200.000.002-02', '(11) 98100-0002', 'patricia.lima@email.com',     'Mãe'),
(3,  'Sandra Ferreira',    '200.000.003-03', '(11) 98100-0003', 'sandra.ferreira@email.com',   'Mãe'),
(4,  'Roberto Pereira',    '200.000.004-04', '(11) 98100-0004', 'roberto.pereira@email.com',   'Pai'),
(5,  'Juliana Martins',    '200.000.005-05', '(11) 98100-0005', 'juliana.martins@email.com',   'Mãe'),
(6,  'Carlos Ribeiro',     '200.000.006-06', '(11) 98100-0006', 'carlos.ribeiro@email.com',    'Pai'),
(7,  'Márcia Santos',      '200.000.007-07', '(11) 98100-0007', 'marcia.santos@email.com',     'Mãe'),
(8,  'Fernando Nunes',     '200.000.008-08', '(11) 98100-0008', 'fernando.nunes@email.com',    'Pai'),
(9,  'Luciana Carvalho',   '200.000.009-09', '(11) 98100-0009', 'luciana.carvalho@email.com',  'Mãe'),
(10, 'Antônio Araújo',     '200.000.010-10', '(11) 98100-0010', 'antonio.araujo@email.com',    'Pai'),
(11, 'Cláudia Mendes',     '200.000.011-11', '(11) 98100-0011', 'claudia.mendes@email.com',    'Mãe'),
(12, 'Ricardo Cardoso',    '200.000.012-12', '(11) 98100-0012', 'ricardo.cardoso@email.com',   'Pai'),
(13, 'Adriana Freitas',    '200.000.013-13', '(11) 98100-0013', 'adriana.freitas@email.com',   'Mãe'),
(14, 'José Correia',       '200.000.014-14', '(11) 98100-0014', 'jose.correia@email.com',      'Pai'),
(15, 'Fabiana Ramos',      '200.000.015-15', '(11) 98100-0015', 'fabiana.ramos@email.com',     'Mãe'),
(16, 'Eduardo Monteiro',   '200.000.016-16', '(11) 98100-0016', 'eduardo.monteiro@email.com',  'Pai'),
(17, 'Renata Duarte',      '200.000.017-17', '(11) 98100-0017', 'renata.duarte@email.com',     'Mãe'),
(18, 'Paulo Azevedo',      '200.000.018-18', '(11) 98100-0018', 'paulo.azevedo@email.com',     'Pai'),
(19, 'Vanessa Machado',    '200.000.019-19', '(11) 98100-0019', 'vanessa.machado@email.com',   'Mãe'),
(20, 'Sérgio Cunha',       '200.000.020-20', '(11) 98100-0020', 'sergio.cunha@email.com',      'Pai');

-- ---- alunos da 3A (20) ---------------------------------------------
INSERT INTO alunos (id_aluno, id_usuario, id_turma, id_responsavel, matricula, nome, cpf, endereco, email_institucional) VALUES
(1,  12, 1, 1,  '20263A001', 'Ana Beatriz Souza',      '100.000.001-01', 'Rua das Acácias, 120 - Centro',        'ana.souza@aluno.escola.edu.br'),
(2,  13, 1, 2,  '20263A002', 'Bruno Henrique Lima',    '100.000.002-02', 'Av. Brasil, 455 - Jardim Primavera',   'bruno.lima@aluno.escola.edu.br'),
(3,  14, 1, 3,  '20263A003', 'Camila Ferreira Rocha',  '100.000.003-03', 'Rua das Palmeiras, 78 - Vila Nova',    'camila.rocha@aluno.escola.edu.br'),
(4,  15, 1, 4,  '20263A004', 'Daniel Alves Pereira',   '100.000.004-04', 'Rua Sete de Setembro, 310 - Centro',   'daniel.pereira@aluno.escola.edu.br'),
(5,  16, 1, 5,  '20263A005', 'Eduarda Martins Costa',  '100.000.005-05', 'Rua dos Ipês, 92 - Jardim das Flores', 'eduarda.costa@aluno.escola.edu.br'),
(6,  17, 1, 6,  '20263A006', 'Felipe Gomes Ribeiro',   '100.000.006-06', 'Av. Paulista, 1500 - Bela Vista',      'felipe.ribeiro@aluno.escola.edu.br'),
(7,  18, 1, 7,  '20263A007', 'Gabriela Santos Oliveira','100.000.007-07','Rua das Acácias, 245 - Centro',        'gabriela.oliveira@aluno.escola.edu.br'),
(8,  19, 1, 8,  '20263A008', 'Heitor Barbosa Nunes',   '100.000.008-08', 'Rua do Comércio, 61 - Vila Nova',      'heitor.nunes@aluno.escola.edu.br'),
(9,  20, 1, 9,  '20263A009', 'Isabela Carvalho Dias',  '100.000.009-09', 'Av. Brasil, 890 - Jardim Primavera',   'isabela.dias@aluno.escola.edu.br'),
(10, 21, 1, 10, '20263A010', 'João Pedro Araújo',      '100.000.010-10', 'Rua das Palmeiras, 134 - Vila Nova',   'joao.araujo@aluno.escola.edu.br'),
(11, 22, 1, 11, '20263A011', 'Larissa Mendes Teixeira','100.000.011-11', 'Rua dos Ipês, 18 - Jardim das Flores', 'larissa.teixeira@aluno.escola.edu.br'),
(12, 23, 1, 12, '20263A012', 'Lucas Cardoso Moreira', '100.000.012-12', 'Rua Sete de Setembro, 77 - Centro',    'lucas.moreira@aluno.escola.edu.br'),
(13, 24, 1, 13, '20263A013', 'Mariana Freitas Campos', '100.000.013-13', 'Av. Paulista, 2200 - Bela Vista',      'mariana.campos@aluno.escola.edu.br'),
(14, 25, 1, 14, '20263A014', 'Matheus Correia Lopes',  '100.000.014-14', 'Rua do Comércio, 405 - Vila Nova',     'matheus.lopes@aluno.escola.edu.br'),
(15, 26, 1, 15, '20263A015', 'Natália Ramos Batista',  '100.000.015-15', 'Rua das Acácias, 56 - Centro',         'natalia.batista@aluno.escola.edu.br'),
(16, 27, 1, 16, '20263A016', 'Pedro Henrique Monteiro','100.000.016-16', 'Av. Brasil, 1020 - Jardim Primavera',  'pedro.monteiro@aluno.escola.edu.br'),
(17, 28, 1, 17, '20263A017', 'Rafaela Duarte Pinto',   '100.000.017-17', 'Rua dos Ipês, 203 - Jardim das Flores','rafaela.pinto@aluno.escola.edu.br'),
(18, 29, 1, 18, '20263A018', 'Rodrigo Azevedo Farias', '100.000.018-18', 'Rua das Palmeiras, 15 - Vila Nova',    'rodrigo.farias@aluno.escola.edu.br'),
(19, 30, 1, 19, '20263A019', 'Sofia Machado Vieira',   '100.000.019-19', 'Rua Sete de Setembro, 540 - Centro',   'sofia.vieira@aluno.escola.edu.br'),
(20, 31, 1, 20, '20263A020', 'Thiago Cunha Borges',    '100.000.020-20', 'Av. Paulista, 880 - Bela Vista',       'thiago.borges@aluno.escola.edu.br');

-- ---- turma x disciplina x professor (3A) ----------------------------
-- ids 1..11 seguem a mesma ordem das disciplinas/professores
INSERT INTO turma_disciplina_professor (id, id_turma, id_disciplina, id_professor) VALUES
(1,  1, 1,  1),   -- Língua Portuguesa - Helena
(2,  1, 2,  2),   -- Matemática        - Ricardo
(3,  1, 3,  3),   -- Física            - Fernanda
(4,  1, 4,  4),   -- Química           - Marcelo
(5,  1, 5,  5),   -- Biologia          - Juliana
(6,  1, 6,  6),   -- História          - André
(7,  1, 7,  7),   -- Geografia         - Patrícia
(8,  1, 8,  8),   -- Inglês            - Carlos Eduardo
(9,  1, 9,  9),   -- Educação Física   - Roberto
(10, 1, 10, 10),  -- Filosofia         - Luciana
(11, 1, 11, 11);  -- Sociologia        - Gustavo

-- ---- cronograma semanal da 3A (5 aulas/dia, 25 no total) ------------
-- Aulas: 07:00-07:50 | 07:50-08:40 | 08:40-09:30 | (intervalo) | 09:50-10:40 | 10:40-11:30
INSERT INTO horarios_aula (id_tdp, dia_semana, hora_inicio, hora_fim, sala) VALUES
-- Segunda
(1,  'Segunda', '07:00', '07:50', 'Sala 3A'),
(2,  'Segunda', '07:50', '08:40', 'Sala 3A'),
(3,  'Segunda', '08:40', '09:30', 'Sala 3A'),
(4,  'Segunda', '09:50', '10:40', 'Sala 3A'),
(6,  'Segunda', '10:40', '11:30', 'Sala 3A'),
-- Terça
(2,  'Terça',   '07:00', '07:50', 'Sala 3A'),
(1,  'Terça',   '07:50', '08:40', 'Sala 3A'),
(5,  'Terça',   '08:40', '09:30', 'Sala 3A'),
(7,  'Terça',   '09:50', '10:40', 'Sala 3A'),
(8,  'Terça',   '10:40', '11:30', 'Sala 3A'),
-- Quarta
(1,  'Quarta',  '07:00', '07:50', 'Sala 3A'),
(2,  'Quarta',  '07:50', '08:40', 'Sala 3A'),
(9,  'Quarta',  '08:40', '09:30', 'Quadra'),
(9,  'Quarta',  '09:50', '10:40', 'Quadra'),
(10, 'Quarta',  '10:40', '11:30', 'Sala 3A'),
-- Quinta
(3,  'Quinta',  '07:00', '07:50', 'Sala 3A'),
(4,  'Quinta',  '07:50', '08:40', 'Sala 3A'),
(1,  'Quinta',  '08:40', '09:30', 'Sala 3A'),
(2,  'Quinta',  '09:50', '10:40', 'Sala 3A'),
(11, 'Quinta',  '10:40', '11:30', 'Sala 3A'),
-- Sexta
(5,  'Sexta',   '07:00', '07:50', 'Sala 3A'),
(6,  'Sexta',   '07:50', '08:40', 'Sala 3A'),
(7,  'Sexta',   '08:40', '09:30', 'Sala 3A'),
(8,  'Sexta',   '09:50', '10:40', 'Sala 3A'),
(10, 'Sexta',   '10:40', '11:30', 'Sala 3A');

-- ---- aulas já dadas (segunda 19/10 e terça 20/10 de 2026) -----------
INSERT INTO aulas (id_aula, id_tdp, data, conteudo) VALUES
(1,  1, '2026-10-19', 'Romantismo: contexto histórico e características'),
(2,  2, '2026-10-19', 'Funções exponenciais'),
(3,  3, '2026-10-19', 'Eletrostática: lei de Coulomb'),
(4,  4, '2026-10-19', 'Eletroquímica: pilhas e baterias'),
(5,  6, '2026-10-19', 'Guerra Fria: origens e conflitos'),
(6,  2, '2026-10-20', 'Logaritmos: definição e propriedades'),
(7,  1, '2026-10-20', 'Interpretação de textos dissertativos'),
(8,  5, '2026-10-20', 'Genética: segunda lei de Mendel'),
(9,  7, '2026-10-20', 'Geopolítica atual'),
(10, 8, '2026-10-20', 'Reading comprehension: questões de ENEM');

-- ---- frequência: todos os alunos x todas as aulas acima -------------
-- Gera algumas faltas distribuídas de forma determinística.
INSERT INTO frequencias (id_aula, id_aluno, presente, justificativa)
SELECT au.id_aula,
       a.id_aluno,
       (MOD(a.id_aluno * 3 + au.id_aula, 11) <> 0) AS presente,
       NULL
FROM aulas au
CROSS JOIN alunos a;

-- ---- avaliações do 3º bimestre (2 por disciplina) -------------------
INSERT INTO avaliacoes (id_tdp, titulo, bimestre, peso, data)
SELECT id, 'Trabalho - 3º bimestre', 3, 0.40, '2026-09-21' FROM turma_disciplina_professor;

INSERT INTO avaliacoes (id_tdp, titulo, bimestre, peso, data)
SELECT id, 'Prova - 3º bimestre', 3, 0.60, '2026-10-05' FROM turma_disciplina_professor;

-- ---- notas: todos os alunos em todas as avaliações (valores 5.0 a 9.9)
INSERT INTO notas (id_avaliacao, id_aluno, valor)
SELECT av.id_avaliacao,
       a.id_aluno,
       ROUND(5 + MOD(a.id_aluno * 7 + av.id_avaliacao * 3, 50) / 10, 1)
FROM avaliacoes av
CROSS JOIN alunos a;

-- ---- tarefas --------------------------------------------------------
INSERT INTO tarefas (id_tdp, titulo, descricao, data_entrega) VALUES
(1, 'Redação: tema livre',            'Dissertação-argumentativa de 25 a 30 linhas.',        '2026-10-30'),
(2, 'Lista de exercícios 12',         'Funções exponenciais e logaritmos, questões 1 a 20.', '2026-10-29'),
(5, 'Resumo de genética',             'Resumo das leis de Mendel com exemplos.',             '2026-11-03'),
(6, 'Pesquisa sobre a Guerra Fria',   'Pesquisa em grupo, 2 páginas, com fontes.',           '2026-11-05'),
(8, 'Exercícios de interpretação',    'Texto do livro, páginas 84 a 86.',                    '2026-10-28');

-- ---- avisos (id_turma NULL = geral) ---------------------------------
INSERT INTO avisos (id_autor, id_turma, titulo, texto, data_publicacao) VALUES
(32, NULL, 'Suspensão de aula em 23/10',        'Dia não letivo. As aulas retornam normalmente na segunda-feira.', '2026-10-19 09:00:00'),
(32, 1,    'Reunião de pais e responsáveis',    'Reunião do 3º bimestre da turma 3A na segunda, 26/10, às 19h.',   '2026-10-20 10:30:00'),
(2,  1,    'Prova de Matemática',               'Revisão de funções e logaritmos na próxima semana.',              '2026-10-21 14:00:00');

-- =====================================================================
-- 3) VIEWS ÚTEIS (boletim e faltas calculados, nunca guardados)
-- =====================================================================

CREATE VIEW vw_boletim AS
SELECT a.id_aluno,
       a.nome       AS aluno,
       d.nome       AS disciplina,
       av.bimestre,
       ROUND(SUM(n.valor * av.peso) / SUM(av.peso), 1) AS media
FROM notas n
JOIN avaliacoes av ON av.id_avaliacao = n.id_avaliacao
JOIN turma_disciplina_professor tdp ON tdp.id = av.id_tdp
JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
JOIN alunos a ON a.id_aluno = n.id_aluno
GROUP BY a.id_aluno, a.nome, d.nome, av.bimestre;

CREATE VIEW vw_faltas_aluno AS
SELECT a.id_aluno,
       a.nome AS aluno,
       COUNT(*)                         AS total_aulas,
       SUM(f.presente = 0)              AS faltas,
       ROUND(100 * SUM(f.presente) / COUNT(*), 1) AS percentual_presenca
FROM frequencias f
JOIN alunos a ON a.id_aluno = f.id_aluno
GROUP BY a.id_aluno, a.nome;

-- =====================================================================
-- 4) CONSULTAS DE EXEMPLO
-- =====================================================================
-- Turmas de um professor (painel do professor):
--   SELECT t.* FROM turmas t
--   JOIN turma_disciplina_professor tdp ON tdp.id_turma = t.id_turma
--   WHERE tdp.id_professor = 2;
--
-- Cronograma de um aluno (via turma):
--   SELECT h.dia_semana, h.hora_inicio, h.hora_fim, d.nome, p.nome AS professor
--   FROM alunos a
--   JOIN turma_disciplina_professor tdp ON tdp.id_turma = a.id_turma
--   JOIN horarios_aula h ON h.id_tdp = tdp.id
--   JOIN disciplinas d ON d.id_disciplina = tdp.id_disciplina
--   JOIN professores p ON p.id_professor = tdp.id_professor
--   WHERE a.id_aluno = 1
--   ORDER BY FIELD(h.dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado'), h.hora_inicio;
--
-- Avisos que um aluno deve ver (da turma + gerais):
--   SELECT av.* FROM avisos av
--   JOIN alunos a ON a.id_aluno = 1
--   WHERE av.id_turma = a.id_turma OR av.id_turma IS NULL
--   ORDER BY av.data_publicacao DESC;
--
-- Boletim de um aluno:
--   SELECT * FROM vw_boletim WHERE id_aluno = 1;
