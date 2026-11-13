export default class TurmaDisciplinaProfessor {
    constructor({
        id, id_turma, id_disciplina, id_professor
    }) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError('ID deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_turma) || id_turma <= 0) {
            throw new TypeError('ID da turma deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_disciplina) || id_disciplina <= 0) {
            throw new TypeError('ID da disciplina deve ser um inteiro positivo');
        }
        if (!Number.isInteger(id_professor) || id_professor <= 0) {
            throw new TypeError('ID do professor deve ser um inteiro positivo');
        }
        this.id = id;
        this.id_turma = id_turma;
        this.id_disciplina = id_disciplina;
        this.id_professor = id_professor;
    }
}