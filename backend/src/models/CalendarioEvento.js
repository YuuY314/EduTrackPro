export default class CalendarioEvento {
  constructor({
    id_evento, id_professor = null, id_turma = null, data, tipo, descricao = '', status = 'confirmada', motivo = null
  }) {
    if (!Number.isInteger(id_evento) || id_evento <= 0) {
      throw new TypeError('ID do evento deve ser um inteiro positivo');
    }
    if (id_professor !== null && (!Number.isInteger(id_professor) || id_professor <= 0)) {
      throw new TypeError('ID do professor deve ser null ou um inteiro positivo');
    }
    if (id_turma !== null && (!Number.isInteger(id_turma) || id_turma <= 0)) {
      throw new TypeError('ID da turma deve ser null ou um inteiro positivo');
    }
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) {
      throw new TypeError('Data deve estar no formato YYYY-MM-DD');
    }
    if (!['Letivo', 'Dia não letivo', 'Reunião de pais/responsáveis', 'Avaliação', 'Feriado'].includes(tipo)) {
      throw new TypeError('Tipo de evento inválido');
    }
    if (!['pendente', 'confirmada', 'recusada'].includes(status)) {
      throw new TypeError('Status inválido');
    }

    this.id_evento = id_evento;
    this.id_professor = id_professor;
    this.id_turma = id_turma;
    this.data = data;
    this.tipo = tipo;
    this.descricao = descricao ? descricao.trim() : null;
    this.status = status;
    this.motivo = motivo ? motivo.trim() : null;
  }
}