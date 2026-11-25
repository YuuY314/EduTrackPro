// =====================================================================
// services/ProfessorService.js - regras do cadastro de professores
//
// Corpo aceito em criar/atualizar (tudo opcional no atualizar):
//   { nome, cpf, email, telefone,
//     vinculos: [{ id_turma, disciplina | id_disciplina }],
//     horarios: [{ id_turma, disciplina | id_disciplina, dia: '1'..'6', hora_inicio, hora_fim?, sala? }] }
//
// Formato antigo (ainda aceito): { disciplinas: [...], id_turmas: [...] }
// vira "cada disciplina em cada turma". Use "vinculos" para escolher a
// disciplina de cada turma.
// =====================================================================

import { emTransacao } from '../config/database.js';
import * as ProfessorModel from '../models/ProfessorModel.js';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash } from '../utils/senha.js';
import { lerPaginacao, lerTextos, montarPaginacao, paraId, validarSenha } from '../utils/validacoes.js';

const TEXTOS = ['nome', 'cpf', 'email'];

// Lê "vinculos" do corpo; se não vier, aceita o formato antigo.
// Devolve undefined quando o corpo não fala de vínculos (= não mexer).
function lerVinculos(body) {
  if (Array.isArray(body.vinculos)) return body.vinculos;
  if (Array.isArray(body.disciplinas) || Array.isArray(body.id_turmas)) {
    const disciplinas = Array.isArray(body.disciplinas) ? body.disciplinas : [];
    const turmas = Array.isArray(body.id_turmas) ? body.id_turmas : [];
    return turmas.flatMap((id_turma) => disciplinas.map((disciplina) => ({ id_turma, disciplina })));
  }
  return undefined;
}

export async function listar(query) {
  const paginacao = lerPaginacao(query);
  const { professores, total } = await ProfessorModel.listar(paginacao);
  return { dados: professores, paginacao: montarPaginacao(paginacao, total) };
}

export async function buscarPorId(idRecebido) {
  const id = paraId(idRecebido);
  const professor = await ProfessorModel.buscarPorId(id);
  if (!professor) throw new AppError(`Professor ${id} não encontrado.`, 404);
  return professor;
}

export async function criar(body = {}) {
  const dados = lerTextos(body, { obrigatorios: [...TEXTOS, 'senha'], opcionais: ['telefone'] });
  const senha_hash = await gerarHash(validarSenha(dados.senha));

  const id = await emTransacao(async (conexao) => {
    const id_usuario = await UsuarioModel.criar({ email: dados.email, senha_hash, perfil: 'professor' }, conexao);
    const id_professor = await ProfessorModel.criar({ ...dados, id_usuario }, conexao);

    await ProfessorModel.sincronizarVinculosEHorarios(
      id_professor,
      {
        vinculos: lerVinculos(body) ?? [],
        horarios: Array.isArray(body.horarios) ? body.horarios : [],
      },
      conexao
    );

    return id_professor;
  });

  return ProfessorModel.buscarPorId(id);
}

export async function atualizar(idRecebido, body = {}) {
  const atual = await buscarPorId(idRecebido);
  const campos = lerTextos(body, { opcionais: [...TEXTOS, 'telefone'] });

  // lerTextos transforma "" em null. Nome/CPF/e-mail são NOT NULL no banco:
  // antes isso virava "Erro interno no servidor" (500) sem explicar o motivo.
  for (const campo of TEXTOS) {
    if (campo in campos && !campos[campo]) {
      throw new AppError(`O campo "${campo}" não pode ficar vazio.`, 400);
    }
  }

  const vinculos = lerVinculos(body);
  const mexeNaGrade = vinculos !== undefined || body.horarios !== undefined;

  await emTransacao(async (conexao) => {
    await ProfessorModel.atualizar(atual.id_professor, campos, conexao);

    // O login (usuarios.email) acompanha o e-mail do professor só quando os
    // dois eram iguais. Se o admin cadastrou um login diferente do e-mail de
    // contato, trocar o contato não pode trocar o login sem ninguém saber.
    if (campos.email && campos.email !== atual.email) {
      const usuario = await UsuarioModel.buscarPorId(atual.id_usuario);
      if (usuario && usuario.email.toLowerCase() === String(atual.email).toLowerCase()) {
        await UsuarioModel.atualizarEmail(atual.id_usuario, campos.email, conexao);
      }
    }

    if (mexeNaGrade) {
      const vinculosFinais = vinculos ?? atual.vinculos;
      const pares = new Set(vinculosFinais.map((v) => `${Number(v.id_turma)}-${v.id_disciplina ?? v.disciplina}`));
      // Sem "horarios" no corpo: mantém os atuais (só dos vínculos que continuam)
      const horarios = Array.isArray(body.horarios)
        ? body.horarios
        : atual.horarios.filter(
            (h) => pares.has(`${h.id_turma}-${h.id_disciplina}`) || pares.has(`${h.id_turma}-${h.disciplina}`)
          );

      await ProfessorModel.sincronizarVinculosEHorarios(
        atual.id_professor,
        { vinculos: vinculosFinais, horarios },
        conexao
      );
    }
  });

  return ProfessorModel.buscarPorId(atual.id_professor);
}

// usuarioLogado = quem está excluindo (vem do token). Os avisos que o professor
// publicou passam a ter esse admin como autor: avisos.id_autor aponta para o
// login (usuarios) e não aceita vazio, então antes a exclusão travava com
// "registro está em uso" sem dizer por quê, e os alunos perderiam os avisos.
export async function excluir(idRecebido, usuarioLogado) {
  const professor = await buscarPorId(idRecebido);
  await emTransacao(async (conexao) => {
    await ProfessorModel.excluir(professor.id_professor, conexao);

    let novoAutor = usuarioLogado?.perfil === 'admin' ? usuarioLogado.sub : null;
    if (!novoAutor) {
      const [[admin]] = await conexao.query("SELECT id_usuario FROM usuarios WHERE perfil = 'admin' ORDER BY id_usuario LIMIT 1");
      novoAutor = admin?.id_usuario ?? null;
    }
    if (novoAutor) {
      await conexao.query('UPDATE avisos SET id_autor = ? WHERE id_autor = ?', [novoAutor, professor.id_usuario]);
    }

    await UsuarioModel.excluir(professor.id_usuario, conexao);
  });
}

// POST /professor/:id/transferir { id_tdp, id_professor_destino }
// Passa uma turma/disciplina (com todo o histórico) para outro professor.
// É o caminho para excluir um professor que já lançou notas ou chamadas.
export async function transferirVinculo(idRecebido, body = {}) {
  const origem = await buscarPorId(idRecebido);
  const idTdp = paraId(body.id_tdp, 'id_tdp');
  const idDestino = paraId(body.id_professor_destino, 'id_professor_destino');

  const resultado = await emTransacao((conexao) =>
    ProfessorModel.transferirVinculo(origem.id_professor, idTdp, idDestino, conexao)
  );
  return {
    mensagem: `${resultado.disciplina} da turma ${resultado.turma} agora é de ${resultado.professor}.`,
    professor: await ProfessorModel.buscarPorId(origem.id_professor),
  };
}
