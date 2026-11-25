const PERIODOS = Object.freeze(['Manhã', 'Tarde', 'Noite']);

export default class Turma {
  static PERIODOS = PERIODOS;

  constructor({ id_turma, id, nome, periodo, ano_letivo }) {
    const idFinal = id_turma ?? id;
    const anoFinal = ano_letivo !== undefined ? Number(ano_letivo) : new Date().getFullYear();

    if (!Number.isInteger(idFinal) || idFinal <= 0) {
      throw new TypeError('ID deve ser um inteiro positivo');
    }
    if (typeof nome !== 'string' || nome.trim() === '') {
      throw new TypeError('Nome é obrigatório');
    }
    if (!PERIODOS.includes(periodo)) {
      throw new TypeError(`Período deve ser um de: ${PERIODOS.join(', ')}`);
    }
    if (!Number.isInteger(anoFinal) || anoFinal < 1901 || anoFinal > 2155) {
      throw new TypeError('Ano letivo deve ser um ano válido (1901–2155)');
    }

    this.id_turma = idFinal;
    this.nome = nome.trim();
    this.periodo = periodo;
    this.ano_letivo = anoFinal;
  }
}