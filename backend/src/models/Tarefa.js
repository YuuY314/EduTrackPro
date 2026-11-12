export default class Disciplina {
    constructor({
        id_tarefa, id_tdp, titulo, descricao, data_entrega
    }) {
        if (!Number.isInteger(id_tarefa) || id_tarefa <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_tdp) || id_tdp <= 0) {
            throw new TypeError('ID da turma-disciplina-professor deve ser um inteiro positivo');
        }
        if (typeof titulo !== 'string' || titulo.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (descricao !== null && (typeof descricao !== 'string' || descricao.trim() === '')) {
            throw new TypeError('Descrição deve ser uma string válida ou nula');
        }
        if (typeof data_entrega !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data_entrega) || Number.isNaN(Date.parse(data_entrega))) {
            throw new TypeError('Data deve estar no formato YYYY-MM-DD');
        }
        this.id_tarefa = id_tarefa;
        this.titulo = titulo.trim();
        this.descricao = descricao?.trim() ?? null;
        this.data_entrega = data_entrega;
    }
}