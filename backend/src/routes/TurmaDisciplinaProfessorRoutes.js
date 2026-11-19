import { Router } from 'express';
import * as TurmaDisciplinaProfessorController from '../controllers/TurmaDisciplinaProfessorController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticar.js';
// import { uploadImagem } from '../middlewares/UploadMiddleware.js';

// Middlewares de autenticação (serão ativados na Sessão 2)
// Inicialmente passam direto para não travar a Sessão 1
export const turma_disciplina_professorRouter = Router();

turma_disciplina_professorRouter.use(autenticar);

const leitura = exigirPerfil('admin', 'professor');
const escrita = exigirPerfil('admin');

turma_disciplina_professorRouter.get('/professor/:idProfessor', leitura, TurmaDisciplinaProfessorController.listarPorProfessor);
turma_disciplina_professorRouter.get('/', leitura, TurmaDisciplinaProfessorController.listar);
turma_disciplina_professorRouter.get('/:id', leitura, TurmaDisciplinaProfessorController.buscarPorId);
turma_disciplina_professorRouter.post('/', escrita, TurmaDisciplinaProfessorController.criar);
turma_disciplina_professorRouter.put('/:id', escrita, TurmaDisciplinaProfessorController.atualizar);
// turma_disciplina_professorRouter.patch('/:id/imagem', (req, res, next) => autenticar(req, res, next), uploadImagem, TurmaDisciplinaProfessorController.enviarImagem);
turma_disciplina_professorRouter.delete('/:id', escrita, TurmaDisciplinaProfessorController.excluir);

//retirei configurarSegurancaTurmaDisciplinaProfessors por turma_disciplina_professorRouter.use(autenticar) já protege todas as rotas do arquivo