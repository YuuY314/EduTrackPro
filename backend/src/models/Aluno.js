export default class Aluno {
    constructor({
        id_aluno, id_usuario, id_turma, id_responsavel, matricula, nome, cpf, endereco, email_institucional
    }) {
        if (!Number.isInteger(id_aluno) || id_aluno <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_turma) || id_turma <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_responsavel) || id_responsavel <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (typeof nome !== 'string' || matricula.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (typeof nome !== 'string' || cpf.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (typeof nome !== 'string' || endereco.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (typeof nome !== 'string' || email_institucional.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        this.id_aluno = id_aluno;
        this.id_turma = id_turma;
        this.id_responsavel = id_responsavel;
        this.id_usuario = id_usuario;
        this.matricula = matricula.trim();
        this.nome = nome.trim();
        this.cpf = cpf.trim();
        this.endereco = endereco.trim();
        this.email_institucional = email_institucional.trim();
    }
}