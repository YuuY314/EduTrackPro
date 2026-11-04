export default class professorid_professor {
    constructor({
        id_professor, id_usuario, nome, cpf, email, telefone
    }) {
        if (!Number.isInteger(id_professor) || id_professor <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (typeof nome !== 'string' || cpf.trim() === '') {
            throw new TypeError('CPF é obrigatório');
        }
        if (typeof nome !== 'string' || email.trim() === '') {
            throw new TypeError('Email Institucional é obrigatório');
        }
        if (typeof nome !== 'string' || telefone.trim() === '') {
            throw new TypeError('Email Institucional é obrigatório');
        }
        this.id_professor = id_professor;
        this.id_usuario = id_usuario;
        this.nome = nome.trim();
        this.cpf = cpf.trim();
        this.email = email.trim();
        this.telefone = telefone.trim();
    }
}