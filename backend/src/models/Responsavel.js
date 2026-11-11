export default class Disciplina {
    constructor({
        id_responsavel, nome, cpf, telefone, email, parentesco
    }) {
        if (!Number.isInteger(id_responsavel) || id_responsavel <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (typeof cpf !== 'string' || cpf.trim() === '') {
            throw new TypeError('CPF é obrigatório');
        }
        if (typeof telefone !== 'string' || telefone.trim() === '') {
            throw new TypeError('Telefone é obrigatório');
        }
        if (email !== null && (typeof email !== 'string' || email.trim() === '')) {
            throw new TypeError('Email deve ser uma string válida ou nula');
        }
        if (typeof parentesco !== 'string' || parentesco.trim() === '') {
            throw new TypeError('Parentesco é obrigatório');
        }
        this.id_responsavel = id_responsavel;
        this.nome = nome.trim();
        this.cpf = cpf.trim();
        this.telefone = telefone.trim();
        this.email = email?.trim() ?? null;
        this.parentesco = parentesco.trim();
    }
}