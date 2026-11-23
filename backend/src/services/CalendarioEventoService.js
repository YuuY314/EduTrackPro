import CalendarioEvento from '../models/CalendarioEvento.js';
import * as CalendarioEventoModel from '../models/CalendarioEventoModel.js';

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

//descobre quem está criando consultando o buscarProfessorPorUsuario pelo ID correspondente
export async function criar(dados) {
  let idProfessor = dados.id_professor ? Number(dados.id_professor) : null;

  if (!idProfessor && dados.id_usuario) {
    idProfessor = await CalendarioEventoModel.buscarProfessorPorUsuario(dados.id_usuario);
  }

  //defini o satus altomatico, se for professor será "pendente" e administrador "confirmada"
  const statusInicial = dados.status ?? (idProfessor ? 'pendente' : 'confirmada');
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

export async function excluir(idRecebido) {
  const id = validarId(idRecebido);
  const removeu = await CalendarioEventoModel.excluir(id);
  if (!removeu) {
    throw new Error(`Evento ${id} não encontrado.`);
  }
}