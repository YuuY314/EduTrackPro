export default class Administrador {
    constructor({
        id_admin, id_usuario, nome, cpf, email, telefone
    }) {
        if (!Number.isInteger(id_admin) || id_admin <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
            throw new TypeError('ID do usuário deve ser um inteiro positivo');
        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (typeof cpf !== 'string' || cpf.trim() === '') {
            throw new TypeError('CPF é obrigatório');
        }
        if (typeof email !== 'string' || email.trim() === '') {
            throw new TypeError('Email é obrigatório');
        }
        if (telefone != null && (typeof telefone !== 'string' || telefone.trim() === '')) {
            throw new TypeError('Telefone deve ser uma string válida ou nula');
        }
        this.id_admin = id_admin;
        this.id_usuario = id_usuario;
        this.nome = nome.trim();
        this.cpf = cpf.trim();
        this.email = email.trim();
        this.telefone = telefone?.trim() ?? null;
    }
}