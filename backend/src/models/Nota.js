export default class Nota {
    constructor({
        id, id_avaliacao, id_aluno, valor
    }) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_avaliacao) || id_avaliacao <= 0) {
            throw new TypeError('ID da avaliação deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_aluno) || id_aluno <= 0) {
            throw new TypeError('ID do aluno deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_aluno) || id_aluno <= 0) {
            throw new TypeError('ID do aluno deve ser um inteiro positivo');
        }
        if(!Number.isFinite(valor) || valor < 0){
            throw new TypeError("Valor deve ser um número maior ou igual a zero");
        }
        this.id = id;
        this.id_avaliacao = id_avaliacao;
        this.id_aluno = id_aluno;
        this.valor = valor;
    }
}