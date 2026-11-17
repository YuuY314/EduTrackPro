export default class Aviso {
    constructor({
        id_aviso, id_autor, id_turma, titulo, texto, data_publicacao
    }) {
        if (!Number.isInteger(id_aviso) || id_aviso <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (id_turma !== null && (!Number.isInteger(id_turma) || id_turma <= 0)) {
            throw new TypeError('ID da turma deve ser null ou um inteiro positivo');
        }
        if (!Number.isInteger(id_autor) || id_autor <= 0) {
            throw new TypeError('ID do autor deve ser um inteiro positivo');
        }
        if (typeof titulo !== 'string' || titulo.trim() === '') {
            throw new TypeError('Título é obrigatório');
        }
        if (typeof texto !== 'string' || texto.trim() === '') {
            throw new TypeError('Texto é obrigatório');
        }
        if (typeof data_publicacao !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data_publicacao) || Number.isNaN(Date.parse(data_publicacao))) {
            throw new TypeError('Data deve estar no formato YYYY-MM-DD');
        }
        this.id_aviso = id_aviso;
        this.id_turma = id_turma;
        this.id_autor = id_autor;
        this.titulo = titulo.trim();
        this.texto = texto.trim();
        this.data_publicacao = data_publicacao;
    }
}