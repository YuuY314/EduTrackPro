export default class Turma {
    constructor({ id_turma, nome, periodo, ano_letivo }) {
        const periodos = [
            'Manhã',
            'Tarde',
            'Noite'
        ];

        if (!Number.isInteger(id_turma) || id_turma <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new TypeError('Nome é obrigatório');
        }
        if (!periodos.includes(periodo)) {
            throw new TypeError(`Período deve ser um de: ${periodos.join(', ')}`);
        }
        if (!Number.isInteger(ano_letivo) || ano_letivo < 1901 || ano_letivo > 2155) {
            throw new TypeError('Ano letivo deve ser um ano válido (1901–2155)');
        }
        this.id_turma = id_turma;
        this.nome = nome.trim();
        this.periodo = periodo;
        this.ano_letivo = ano_letivo;
    }
}