export default class Frequencia {
    constructor({
        id, id_aula, id_aluno, presente, justificativa
    }) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (id_aluno !== null && (!Number.isInteger(id_aluno) || id_aluno <= 0)) {
            throw new TypeError('ID da aluno deve ser null ou um inteiro positivo');
        }
        if (!Number.isInteger(id_aula) || id_aula <= 0) {
            throw new TypeError('ID da aula deve ser um inteiro positivo');
        }
        if (presente !== 0 && presente !== 1) {
            throw new TypeError('Presente deve ser 0 ou 1');
        }
        if (justificativa !== null && (typeof justificativa !== 'string' || justificativa.trim() === '')) {
            throw new TypeError('Justificativa deve ser uma string válida ou nula');
        }
        this.id = id;
        this.id_aluno = id_aluno;
        this.id_aula = id_aula;
        this.presente = presente;
        this.justificativa = justificativa?.trim() ?? null;
    }
}