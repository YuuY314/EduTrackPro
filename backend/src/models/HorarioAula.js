export default class HorarioAula {
    constructor({
        id, id_tdp, dia_semana, hora_inicio, hora_fim, sala
    }) {
        const diasSemana = [
            'Segunda',
            'Terça',
            'Quarta',
            'Quinta',
            'Sexta',
            'Sábado',
            'Domingo'
        ];

        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_tdp) || id_tdp <= 0) {
            throw new TypeError('ID da turma-disciplina-professor deve ser um inteiro positivo');
        }
        if (!diasSemana.includes(dia_semana)) {
            throw new TypeError(`Dia da semana deve ser um de: ${diasSemana.join(', ')}`);
        }
        if (typeof hora_inicio !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora_inicio)) {
            throw new TypeError('Hora de início deve estar no formato HH:MM:SS');
        }
        if (typeof hora_fim !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora_fim)) {
            throw new TypeError('Hora de fim deve estar no formato HH:MM:SS');
        }
        if (sala !== null && (typeof sala !== 'string' || sala.trim() === '')) {
            throw new TypeError('Sala deve ser uma string válida ou nula');
        }
        this.id = id;
        this.id_tdp = id_tdp;
        this.dia_semana = dia_semana;
        this.hora_inicio = hora_inicio;
        this.hora_fim = hora_fim;
        this.sala = sala?.trim() ?? null;
    }
}