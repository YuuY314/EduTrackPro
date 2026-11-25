export default class Disciplina {
  constructor({ id_disciplina, id, nome }) {
    const idFinal = id_disciplina ?? id;
    if (!Number.isInteger(idFinal) || idFinal <= 0) {
      throw new TypeError('ID deve ser um inteiro positivo');
    }
    if (typeof nome !== 'string' || nome.trim() === '') {
      throw new TypeError('Nome é obrigatório');
    }
    this.id_disciplina = idFinal;
    this.nome = nome.trim();
  }
}