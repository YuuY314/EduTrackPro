export default class Disciplina {
    constructor({
        id_disciplina, nome
    }) {
        if (!Number.isInteger(id_disciplina) || id_disciplina <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        this.id_disciplina = id_disciplina;
        this.nome = nome.trim();
    }
}