export default class Avaliacao {
    constructor({ id_avaliacao, id_tdp, titulo, bimestre, peso, data }) {
        if (!Number.isInteger(id_avaliacao) || id_avaliacao <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_tdp) || id_tdp <= 0) {
            throw new TypeError('ID da turma-disciplina-professor deve ser um inteiro positivo');
        }
        if (typeof titulo !== 'string' || titulo.trim() === '' || titulo.trim().length > 100) {
            throw new TypeError('Título é obrigatório e deve ter até 100 caracteres');
        }
        if (!Number.isInteger(bimestre) || bimestre < 1 || bimestre > 4) {
            throw new TypeError('Bimestre deve ser um inteiro entre 1 e 4');
        }
        if (typeof peso !== 'number' || !Number.isFinite(peso) || peso <= 0 || peso > 99.99) {
            throw new TypeError('Peso deve ser um número entre 0,01 e 99,99');
        }
        if (data != null && (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data)))) {
            throw new TypeError('Data deve estar no formato YYYY-MM-DD');
        }

        this.id_avaliacao = id_avaliacao;
        this.id_tdp = id_tdp;
        this.titulo = titulo.trim();
        this.bimestre = bimestre;
        this.peso = peso;
        this.data = data ?? null;
    }
}