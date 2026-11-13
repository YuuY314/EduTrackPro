export default class Aula {
    constructor({ id_aula, id_tdp, data, conteudo }) {
        if (!Number.isInteger(id_aula) || id_aula <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_tdp) || id_tdp <= 0) {
            throw new TypeError('ID da turma-disciplina-professor deve ser um inteiro positivo');
        }
        if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) {
            throw new TypeError('Data deve estar no formato YYYY-MM-DD');
        }
        if (conteudo != null && typeof conteudo !== 'string') {
            throw new TypeError('Conteúdo deve ser um texto');
        }

        this.id_aula = id_aula;
        this.id_tdp = id_tdp;
        this.data = data;
        this.conteudo = conteudo?.trim() || null;
    }
}