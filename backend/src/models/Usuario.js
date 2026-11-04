import { email } from "zod";

export default class Usuario {
    constructor({
        id_usuario, email, senha_hash, perfil
    }) {
        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (typeof nome !== 'string' || email.trim() === '') {
            throw new TypeError('Email é obrigatório');
        }
        if (typeof nome !== 'string' || senha_hash.trim() === '') {
            throw new TypeError('Senha é obrigatório');
        }
        if (typeof nome !== 'string' || perfil.trim() === '') {
            throw new TypeError('Perfil é obrigatório');
        }
        this.id_usuario = id_usuario;
        this.email = email.trim();
        this.senha_hash = senha_hash.trim();
        this.perfil = perfil.trim();
    }
}