import CalendarioEvento from '../models/CalendarioEvento.js';
import * as CalendarioEventoModel from '../models/CalendarioEventoModel.js';
import { AppError } from '../utils/AppError.js';

//pega o parâmetro da URL e converte para um número (Number)
function validarId(idRecebido) {
  const id = Number(idRecebido);
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError('ID deve ser um número inteiro positivo.');
  }
  return id;
}

//repassa o filtro para CalendarioEventoModel.js
export async function listar(filtros = {}) {
  return await CalendarioEventoModel.listar(filtros);
}

//valida o ID para buscalo no banco e se não encontardo lança erro (que o controller transforma em 404)
export async function buscarPorId(idRecebido) {
  const id = validarId(idRecebido);
  const evento = await CalendarioEventoModel.buscarPorId(id);
  if (!evento) {
    throw new Error(`Evento ${id} não encontrado.`);
  }
  return evento;
}

//quem está criando vem do TOKEN (usuario), nunca do corpo da requisição:
//professor sempre cria uma solicitação "pendente" em nome dele mesmo;
//admin pode escolher o status (padrão "confirmada") e o professor ligado ao evento
export async function criar(dados = {}, usuario) {
  const ehProfessor = usuario?.perfil === 'professor';

  let idProfessor;
  let statusInicial;
  if (ehProfessor) {
    idProfessor = usuario.id_professor
      ?? (await CalendarioEventoModel.buscarProfessorPorUsuario(usuario.sub));
    statusInicial = 'pendente';
  } else {
    idProfessor = dados.id_professor ? Number(dados.id_professor) : null;
    statusInicial = dados.status ?? 'confirmada';
  }
  const eventoDominio = new CalendarioEvento({
    ...dados,
    id_evento: 1,
    id_professor: idProfessor,
    id_turma: dados.id_turma ? Number(dados.id_turma) : null,
    status: statusInicial,
  });

  return await CalendarioEventoModel.criar(eventoDominio);
}

//busca o evento existente no banco e permite atualizar somente uma parte do registro (cocmo alterar o status e manter a data), além de preservar o autor da solicitação; por fim, validação pela classe do CalendarioEvento salvando e retornando atualizado
export async function atualizar(idRecebido, dados) {
  const id = validarId(idRecebido);
  const existente = await buscarPorId(id);

  const validado = new CalendarioEvento({
    ...existente,
    ...dados,
    id_evento: id,
    id_professor: existente.id_professor,
    id_turma: dados.id_turma !== undefined
      ? (dados.id_turma ? Number(dados.id_turma) : null)
      : existente.id_turma,
  });

  await CalendarioEventoModel.atualizar(id, {
    id_turma: validado.id_turma,
    data: validado.data,
    tipo: validado.tipo,
    descricao: validado.descricao,
    status: validado.status,
    motivo: validado.motivo,
  });

  return await CalendarioEventoModel.buscarPorId(id);
}

export async function excluir(idRecebido, usuario) {
  const id = validarId(idRecebido);

  //professor só pode cancelar as PRÓPRIAS solicitações que ainda estão pendentes
  if (usuario?.perfil === 'professor') {
    const evento = await buscarPorId(id);
    if (Number(evento.id_professor) !== Number(usuario.id_professor) || evento.status !== 'pendente') {
      throw new AppError('Você só pode cancelar as suas próprias solicitações pendentes.', 403);
    }
  }

  const removeu = await CalendarioEventoModel.excluir(id);
  if (!removeu) {
    throw new Error(`Evento ${id} não encontrado.`);
  }
}