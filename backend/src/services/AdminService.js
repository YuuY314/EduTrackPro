// =====================================================================
// services/AdminService.js - dados e ações do painel do administrador
// Tudo em um lugar: listagens já "prontas para a tela" + criar/editar.
// =====================================================================

import { emTransacao, pool } from '../config/database.js';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash } from '../utils/senha.js';
import { bimestreAtual } from '../utils/bimestre.js';
import { lerTextos, paraId, validarSenha } from '../utils/validacoes.js';
import { enviarEmailLembreteNotas } from './GmailAPIService.js';
import * as ProfessorService from './ProfessorService.js';

// bimestre atual: bimestreAtual() de utils/bimestre.js (antes era fixo em 3)
const PERIODOS = ['Manhã', 'Tarde', 'Noite'];

// Regra RÍGIDA de notas pendentes (decisão do grupo, 25/11/2026). Uma
// turma/disciplina (x = turma_disciplina_professor) está PENDENTE no bimestre se:
//   - ainda não tem nenhuma avaliação no bimestre, OU
//   - tem alguma avaliação do bimestre sem nenhuma nota lançada
//     (ex.: lançou Prova 1 e Trabalho, mas a coluna Prova 2 está vazia).
// Usada no painel (resumo), na lista de professores e no lembrete por e-mail,
// para que as três telas sempre concordem. Recebe o bimestre DUAS vezes.
const TDP_PENDENTE = `(
      NOT EXISTS (SELECT 1 FROM avaliacoes av WHERE av.id_tdp = x.id AND av.bimestre = ?)
   OR EXISTS (SELECT 1 FROM avaliacoes av
               WHERE av.id_tdp = x.id AND av.bimestre = ?
                 AND NOT EXISTS (SELECT 1 FROM notas n WHERE n.id_avaliacao = av.id_avaliacao)))`;

const q = async (sql, params = [], db = pool) => (await db.query(sql, params))[0];

// ---------- resumo do painel ----------
export async function resumo() {
  const [[{ alunos }]] = await pool.query('SELECT COUNT(*) AS alunos FROM alunos');
  const [[{ professores }]] = await pool.query('SELECT COUNT(*) AS professores FROM professores');
  const [[{ freq }]] = await pool.query('SELECT ROUND(AVG(presente) * 100) AS freq FROM frequencias');
  const alunosRisco = await q(
    `SELECT a.id_aluno, a.nome, t.nome AS turma, t.periodo AS turno,
            ROUND(AVG(f.presente) * 100) AS presenca
       FROM alunos a JOIN turmas t ON t.id_turma = a.id_turma
       JOIN frequencias f ON f.id_aluno = a.id_aluno
      GROUP BY a.id_aluno HAVING presenca < 75 ORDER BY presenca LIMIT 6`);
  const atrasados = await listarProfessores({ somenteAtrasados: true });
  const bim = bimestreAtual();
  const [[{ turmasPendentes }]] = await pool.query(
    `SELECT COUNT(DISTINCT x.id_turma) AS turmasPendentes
       FROM turma_disciplina_professor x
      WHERE ${TDP_PENDENTE}`, [bim, bim]);
  return {
    alunos, professores, frequenciaMedia: freq === null ? null : Number(freq),
    turmasPendentes, alunosRisco, lancamentosAtrasados: atrasados.slice(0, 6),
  };
}

// ---------- turmas ----------
export async function listarTurmas() {
  return q(
    `SELECT t.id_turma, t.nome, t.periodo, t.ano_letivo,
            (SELECT COUNT(*) FROM alunos a WHERE a.id_turma = t.id_turma) AS alunos,
            (SELECT COUNT(*) FROM disciplinas) - (SELECT COUNT(*) FROM turma_disciplina_professor x WHERE x.id_turma = t.id_turma) AS sem_professor
       FROM turmas t ORDER BY t.ano_letivo DESC, t.nome`);
}

export async function criarTurma(body = {}) {
  const dados = lerTextos(body, { obrigatorios: ['nome', 'periodo'] });
  const ano = Number(body.ano_letivo);
  if (!PERIODOS.includes(dados.periodo)) throw new AppError('Período inválido.', 400);
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2155) throw new AppError('Ano letivo inválido.', 400);
  const [r] = await pool.query('INSERT INTO turmas (nome, periodo, ano_letivo) VALUES (?, ?, ?)', [dados.nome, dados.periodo, ano]);
  return { id_turma: r.insertId, nome: dados.nome, periodo: dados.periodo, ano_letivo: ano, alunos: 0, sem_professor: 0 };
}

// ---------- responsáveis ----------
export const listarResponsaveis = () => q('SELECT * FROM responsaveis ORDER BY nome');

// ---------- alunos ----------
const SELECT_ALUNO = `
  SELECT a.id_aluno, a.id_turma, a.id_responsavel, a.matricula, a.nome, a.cpf, a.endereco,
         a.email_institucional, t.nome AS turma, t.periodo AS turno,
         r.nome AS responsavel, r.cpf AS responsavel_cpf, r.telefone AS responsavel_telefone,
         r.email AS responsavel_email, r.parentesco AS responsavel_parentesco,
         (SELECT ROUND(AVG(f.presente) * 100) FROM frequencias f WHERE f.id_aluno = a.id_aluno) AS presenca
    FROM alunos a
    JOIN turmas t ON t.id_turma = a.id_turma
    JOIN responsaveis r ON r.id_responsavel = a.id_responsavel`;

export const listarAlunos = () => q(`${SELECT_ALUNO} ORDER BY a.nome`);

async function buscarAluno(id, db = pool) {
  const [l] = await db.query(`${SELECT_ALUNO} WHERE a.id_aluno = ?`, [id]);
  if (!l[0]) throw new AppError('Aluno não encontrado.', 404);
  return l[0];
}

async function gravarResponsavel(r = {}, db) {
  const d = lerTextos(r, { obrigatorios: ['nome', 'cpf', 'telefone', 'parentesco'], opcionais: ['email'] });
  const [x] = await db.query(
    'INSERT INTO responsaveis (nome, cpf, telefone, email, parentesco) VALUES (?, ?, ?, ?, ?)',
    [d.nome, d.cpf, d.telefone, d.email ?? null, d.parentesco]);
  return x.insertId;
}

export async function criarAluno(body = {}) {
  const d = lerTextos(body, {
    obrigatorios: ['matricula', 'nome', 'cpf', 'email_institucional', 'senha'], opcionais: ['endereco'],
  });
  const id_turma = paraId(body.id_turma, 'id_turma');
  const senha_hash = await gerarHash(validarSenha(d.senha));
  const id = await emTransacao(async (c) => {
    const id_responsavel = body.responsavel
      ? await gravarResponsavel(body.responsavel, c)
      : paraId(body.id_responsavel, 'id_responsavel');
    const id_usuario = await UsuarioModel.criar({ email: d.email_institucional, senha_hash, perfil: 'aluno' }, c);
    const [r] = await c.query(
      `INSERT INTO alunos (id_usuario, id_turma, id_responsavel, matricula, nome, cpf, endereco, email_institucional)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_usuario, id_turma, id_responsavel, d.matricula, d.nome, d.cpf, d.endereco ?? null, d.email_institucional]);
    return r.insertId;
  });
  return buscarAluno(id);
}

export async function atualizarAluno(idRecebido, body = {}) {
  const id = paraId(idRecebido);
  const atual = await buscarAluno(id);
  const d = lerTextos(body, { obrigatorios: ['nome', 'email_institucional'], opcionais: ['cpf', 'endereco'] });
  const id_turma = paraId(body.id_turma ?? atual.id_turma, 'id_turma');
  await emTransacao(async (c) => {
    await c.query(
      `UPDATE alunos SET nome = ?, cpf = COALESCE(?, cpf), endereco = ?, email_institucional = ?, id_turma = ? WHERE id_aluno = ?`,
      [d.nome, d.cpf ?? null, d.endereco ?? null, d.email_institucional, id_turma, id]);
    const [[a]] = await c.query('SELECT id_usuario FROM alunos WHERE id_aluno = ?', [id]);
    await UsuarioModel.atualizarEmail(a.id_usuario, d.email_institucional, c);
    if (body.responsavel) {
      const r = lerTextos(body.responsavel, {
        obrigatorios: ['nome'], opcionais: ['cpf', 'telefone', 'email', 'parentesco'],
      });
      await c.query(
        `UPDATE responsaveis SET nome = ?, cpf = COALESCE(?, cpf), telefone = COALESCE(?, telefone),
                email = ?, parentesco = COALESCE(?, parentesco) WHERE id_responsavel = ?`,
        [r.nome, r.cpf ?? null, r.telefone ?? null, r.email ?? null, r.parentesco ?? null, atual.id_responsavel]);
    }
  });
  return buscarAluno(id);
}

export async function excluirAluno(idRecebido) {
  const id = paraId(idRecebido);
  const a = await buscarAluno(id);
  await emTransacao(async (c) => {
    const [[u]] = await c.query('SELECT id_usuario FROM alunos WHERE id_aluno = ?', [a.id_aluno]);
    await c.query('DELETE FROM alunos WHERE id_aluno = ?', [a.id_aluno]);
    await UsuarioModel.excluir(u.id_usuario, c);
  });
}

// ---------- professores ----------
export async function listarProfessores({ somenteAtrasados = false } = {}) {
  const linhas = await q(
    `SELECT p.id_professor, p.nome, p.cpf, p.email, p.telefone,
            (SELECT GROUP_CONCAT(DISTINCT d.nome ORDER BY d.nome SEPARATOR ', ')
               FROM turma_disciplina_professor x JOIN disciplinas d ON d.id_disciplina = x.id_disciplina
              WHERE x.id_professor = p.id_professor) AS disciplina,
            (SELECT GROUP_CONCAT(DISTINCT x.id_turma) FROM turma_disciplina_professor x
              WHERE x.id_professor = p.id_professor) AS ids_turmas,
            (SELECT COUNT(*) FROM turma_disciplina_professor x WHERE x.id_professor = p.id_professor) AS total_tdp,
            (SELECT COUNT(*) FROM turma_disciplina_professor x
              WHERE x.id_professor = p.id_professor
                AND ${TDP_PENDENTE}) AS pendentes
       FROM professores p ORDER BY p.nome`, [bimestreAtual(), bimestreAtual()]);
  const todos = linhas.map((p) => ({
    ...p,
    ids_turmas: p.ids_turmas ? p.ids_turmas.split(',').map(Number) : [],
    situacao: p.total_tdp === 0 ? 'novo' : p.pendentes > 0 ? 'atrasado' : 'em-dia',
  }));
  return somenteAtrasados ? todos.filter((p) => p.situacao === 'atrasado') : todos;
}

async function buscarProfessor(id) {
  const p = (await listarProfessores()).find((x) => x.id_professor === id);
  if (!p) throw new AppError('Professor não encontrado.', 404);
  return p;
}

// O e-mail de LOGIN (usuarios.email) pode ser diferente do e-mail de contato
// do professor/admin: a tela de cadastro tem "Usar o mesmo email do usuário".
// Antes o e-mail de login digitado era descartado quando a caixa era desmarcada
// e a pessoa só conseguia entrar com o e-mail de contato.
function emailDeLogin(body, emailContato) {
  if (body.email_login === undefined || body.email_login === null || body.email_login === '') return emailContato;
  const { email_login } = lerTextos(body, { obrigatorios: ['email_login'] });
  return email_login;
}

export async function criarProfessor(body = {}) {
  const d = lerTextos(body, { obrigatorios: ['nome', 'cpf', 'email', 'senha'], opcionais: ['telefone'] });
  const senha_hash = await gerarHash(validarSenha(d.senha));
  const id = await emTransacao(async (c) => {
    const id_usuario = await UsuarioModel.criar({ email: emailDeLogin(body, d.email), senha_hash, perfil: 'professor' }, c);
    const [r] = await c.query(
      'INSERT INTO professores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)',
      [id_usuario, d.nome, d.cpf, d.email, d.telefone ?? null]);
    return r.insertId;
  });
  return buscarProfessor(id);
}

// Mesmas regras da tela "Professores" (ProfessorService): antes havia aqui uma
// cópia própria (sincronizarAulas) com regras diferentes. Este endpoint aceita
// { disciplina, id_turmas } e mexe só nas turmas DESSA disciplina.
export async function atualizarProfessor(idRecebido, body = {}) {
  const id = paraId(idRecebido);
  await buscarProfessor(id);
  const corpo = { nome: body.nome, cpf: body.cpf, email: body.email, telefone: body.telefone };

  const disciplina = typeof body.disciplina === 'string' ? body.disciplina.trim() : '';
  if (disciplina && Array.isArray(body.id_turmas)) {
    const atual = await ProfessorService.buscarPorId(id);
    corpo.vinculos = [
      ...atual.vinculos.filter((v) => v.disciplina.toLowerCase() !== disciplina.toLowerCase()),
      ...body.id_turmas.map((t) => ({ id_turma: paraId(t, 'id_turmas'), disciplina })),
    ];
  }
  await ProfessorService.atualizar(id, corpo);
  return buscarProfessor(id);
}

export async function excluirProfessor(idRecebido, usuarioLogado) {
  const id = paraId(idRecebido);
  await buscarProfessor(id);
  await ProfessorService.excluir(id, usuarioLogado);
}

// Lembrete de notas pendentes: o front manda só o id; quem decide se o professor
// está atrasado, para qual e-mail enviar e o que listar é o servidor.
export async function enviarLembreteProfessor(idRecebido) {
  const id = paraId(idRecebido);
  const professor = await buscarProfessor(id);

  if (professor.situacao !== 'atrasado') {
    throw new AppError('Este professor não tem notas pendentes neste bimestre.', 409);
  }

  const bimestre = bimestreAtual();
  const pendencias = await q(
    `SELECT d.nome AS disciplina, t.nome AS turma
       FROM turma_disciplina_professor x
       JOIN disciplinas d ON d.id_disciplina = x.id_disciplina
       JOIN turmas t ON t.id_turma = x.id_turma
      WHERE x.id_professor = ?
        AND ${TDP_PENDENTE}
      ORDER BY t.nome, d.nome`,
    [id, bimestre, bimestre]);

  try {
    await enviarEmailLembreteNotas({
      to: professor.email,
      nome: professor.nome,
      bimestre,
      pendencias,
    });
  } catch (erro) {
    console.error('Erro ao enviar lembrete:', erro);
    throw new AppError('Não foi possível enviar o e-mail agora. Tente novamente.', 502);
  }

  return { mensagem: `Lembrete enviado para ${professor.nome}.` };
}

// ---------- administradores ----------
export async function criarAdministrador(body = {}) {
  const d = lerTextos(body, { obrigatorios: ['nome', 'cpf', 'email', 'senha'], opcionais: ['telefone'] });
  const senha_hash = await gerarHash(validarSenha(d.senha));
  const id = await emTransacao(async (c) => {
    const id_usuario = await UsuarioModel.criar({ email: emailDeLogin(body, d.email), senha_hash, perfil: 'admin' }, c);
    const [r] = await c.query(
      'INSERT INTO administradores (id_usuario, nome, cpf, email, telefone) VALUES (?, ?, ?, ?, ?)',
      [id_usuario, d.nome, d.cpf, d.email, d.telefone ?? null]);
    return r.insertId;
  });
  return { id_admin: id, nome: d.nome, email: d.email };
}
