// =====================================================================
// services/ProfessorService.js - regras do cadastro de professores
// =====================================================================

import { emTransacao } from '../config/database.js';
import * as ProfessorModel from '../models/ProfessorModel.js';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { AppError } from '../utils/AppError.js';
import { gerarHash } from '../utils/senha.js';
import { lerPaginacao, lerTextos, montarPaginacao, paraId, validarSenha } from '../utils/validacoes.js';

const TEXTOS = ['nome', 'cpf', 'email'];

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
        disciplinas: Array.isArray(body.disciplinas) ? body.disciplinas : [],
        id_turmas: Array.isArray(body.id_turmas) ? body.id_turmas : [],
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

  await emTransacao(async (conexao) => {
    await ProfessorModel.atualizar(atual.id_professor, campos, conexao);
    if (campos.email) await UsuarioModel.atualizarEmail(atual.id_usuario, campos.email, conexao);

    if (body.disciplinas !== undefined || body.id_turmas !== undefined || body.horarios !== undefined) {
      await ProfessorModel.sincronizarVinculosEHorarios(
        atual.id_professor,
        {
          disciplinas: Array.isArray(body.disciplinas) ? body.disciplinas : atual.disciplinas,
          id_turmas: Array.isArray(body.id_turmas) ? body.id_turmas : atual.ids_turmas,
          horarios: Array.isArray(body.horarios) ? body.horarios : atual.horarios,
        },
        conexao
      );
    }
  });

  return ProfessorModel.buscarPorId(atual.id_professor);
}

export async function excluir(idRecebido) {
  const professor = await buscarPorId(idRecebido);
  await emTransacao(async (conexao) => {
    await ProfessorModel.excluir(professor.id_professor, conexao);
    await UsuarioModel.excluir(professor.id_usuario, conexao);
  });
}