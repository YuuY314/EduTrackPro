export const perfis = {
  aluno: {
    inicio: '/aluno',
    menu: [
      { href: '/aluno', nome: 'Início' },
      { href: '/aluno/boletim', nome: 'Boletim' },
      { href: '/aluno/presenca', nome: 'Presença' },
    ],
    iniciais: 'GA',
    nome: 'Gabriel Araujo',
    detalhe: '3ª Série E · Noite',
    nomeCompleto: 'Gabriel Araujo Januario de Freitas',
    detalheCompleto: 'Mauá Visconde de · 3ª Série E Noite Anual',
    saudacao: 'Gabriel',
    saudacaoDetalhe: '3ª Série E Noite Anual · Mauá Visconde de',
    avisos: '99+',
    opcoes: ['Meu perfil', 'Minhas conquistas', 'Configurações'],
  },
  professor: {
    inicio: '/professor',
    menu: [
      { href: '/professor', nome: 'Início' },
      { href: '/professor/turmas', nome: 'Minhas turmas' },
      { href: '/professor/chamada', nome: 'Chamada' },
      { href: '/professor/notas', nome: 'Notas' },
    ],
    iniciais: 'RL',
    nome: 'Prof. Ricardo Lima',
    detalhe: 'Matemática',
    nomeCompleto: 'Ricardo Lima',
    detalheCompleto: 'Professor de Matemática · Mauá Visconde de',
    saudacao: 'Prof. Ricardo',
    saudacaoDetalhe: 'Matemática · 4 turmas · Mauá Visconde de',
    avisos: '4',
    opcoes: ['Meu perfil', 'Horário de aulas', 'Configurações'],
  },
  admin: {
    inicio: '/admin',
    menu: [
      { href: '/admin', nome: 'Painel' },
      { href: '/admin/alunos', nome: 'Alunos' },
      { href: '/admin/professores', nome: 'Professores' },
      { href: '/admin/turmas', nome: 'Turmas' },
      { href: '/admin/calendario', nome: 'Calendário' },
    ],
    iniciais: 'SM',
    nome: 'Sandra Moreira',
    detalhe: 'Administração',
    nomeCompleto: 'Sandra Moreira',
    detalheCompleto: 'Administração · Mauá Visconde de',
    saudacao: 'Sandra',
    saudacaoDetalhe: 'Administração · Mauá Visconde de',
    avisos: '12',
    opcoes: ['Meu perfil', 'Usuários e permissões', 'Configurações da escola'],
  },
};

export const agenda = [
  { data: '2026-10-19', tipo: 'Letivo', descricao: '' },
  { data: '2026-10-23', tipo: 'Dia não letivo', descricao: 'Suspensão de aulas (Decreto 70.047, de 8/9/2025)' },
  { data: '2026-10-26', tipo: 'Letivo', descricao: '' },
  { data: '2026-10-26', tipo: 'Reunião de pais/responsáveis', descricao: 'Reunião de pais – 3º bimestre' },
  { data: '2026-10-28', tipo: 'Letivo', descricao: '' },
];

export const presencaPorComponente = [
  { componente: 'Biologia', faltas: 0, presenca: 100 },
  { componente: 'Física', faltas: 0, presenca: 100 },
  { componente: 'Geografia', faltas: 0, presenca: 100 },
  { componente: 'História', faltas: 0, presenca: 100 },
  { componente: 'Língua Portuguesa', faltas: 0, presenca: 100 },
  { componente: 'Matemática', faltas: 2, presenca: 71 },
  { componente: 'Orientação de Estudo – Língua Portuguesa', faltas: 0, presenca: 100 },
  { componente: 'Orientação de Estudo – Matemática', faltas: 0, presenca: 100 },
  { componente: 'Química', faltas: 0, presenca: 100 },
  { componente: 'Redação e Leitura', faltas: 0, presenca: 100 },
];

export const boletim = [
  { componente: 'Aprofundamento de Filosofia', notas: [5, 8, 8, null, null] },
  { componente: 'Aprofundamento de Geografia', notas: [2, 5, 10, null, null] },
  { componente: 'Aprofundamento de Sociologia', notas: [5, 5, 10, null, null] },
  { componente: 'Atualidades', notas: [5, 5, 10, null, null] },
  { componente: 'Biologia', notas: [6, 6, 7, null, null] },
  { componente: 'Física', notas: [8, 9, 7, null, null] },
  { componente: 'Geografia', notas: [5, 7, 6, null, null] },
  { componente: 'História', notas: [7, 6, 3, null, null] },
  { componente: 'Língua Inglesa', notas: [5, 5, null, null, null] },
  { componente: 'Língua Portuguesa', notas: [5, 5, 6, null, null] },
];

export const turmas = [
  { id: '3E', nome: '3ª Série E', turno: 'Noite', sala: 'Sala 12', alunos: 38, media: 5.9, presenca: 89, semProfessor: 0 },
  { id: '3A', nome: '3ª Série A', turno: 'Manhã', sala: 'Sala 4', alunos: 40, media: 6.4, presenca: 94, semProfessor: 1 },
  { id: '2B', nome: '2ª Série B', turno: 'Manhã', sala: 'Sala 7', alunos: 36, media: 6.1, presenca: 92, semProfessor: 0 },
  { id: '1C', nome: '1ª Série C', turno: 'Tarde', sala: 'Sala 9', alunos: 41, media: 5.6, presenca: 88, semProfessor: 2 },
];

export const aulasDeHoje = [
  { hora: '13:00', turma: '1ª Série C', detalhe: 'Sala 9 · 2 aulas' },
  { hora: '19:00', turma: '3ª Série E', detalhe: 'Sala 12 · 2 aulas' },
  { hora: '20:40', turma: '3ª Série E', detalhe: 'Sala 12 · Orientação de Estudo' },
];

export const alunosDaTurma = [
  'Ana Beatriz Souza', 'Bruno Oliveira', 'Carla Mendes', 'Diego Santos',
  'Eduarda Lima', 'Felipe Rocha', 'Gabriel Araujo', 'Giovana Alves',
  'Henrique Costa', 'Isabela Martins', 'João Pedro Silva', 'Larissa Ferreira',
];

export const notasDaTurma = [
  { aluno: 'Ana Beatriz Souza', notas: [6, 7, 8] },
  { aluno: 'Bruno Oliveira', notas: [7.5, 8, 9] },
  { aluno: 'Carla Mendes', notas: [5, 4.5, 6] },
  { aluno: 'Diego Santos', notas: [8, 7.5, 8] },
  { aluno: 'Eduarda Lima', notas: [4, 5, null] },
  { aluno: 'Felipe Rocha', notas: [5.5, 6, 7] },
  { aluno: 'Gabriel Araujo', notas: [5, null, 7] },
  { aluno: 'Giovana Alves', notas: [9, 8.5, 10] },
  { aluno: 'Henrique Costa', notas: [7, 6, 8] },
  { aluno: 'Isabela Martins', notas: [8.5, 9, 9] },
  { aluno: 'João Pedro Silva', notas: [6.5, 7, 7] },
  { aluno: 'Larissa Ferreira', notas: [7, 6.5, 8] },
];

export const alunosDaEscola = [
  { matricula: '26.0412', nome: 'Ana Beatriz Souza', turma: '3ª Série E', turno: 'Noite', presenca: 96 },
  { matricula: '26.0418', nome: 'Eduarda Lima', turma: '3ª Série E', turno: 'Noite', presenca: 68 },
  { matricula: '26.0421', nome: 'Felipe Rocha', turma: '3ª Série E', turno: 'Noite', presenca: 73 },
  { matricula: '26.0425', nome: 'Gabriel Araujo Januario de Freitas', turma: '3ª Série E', turno: 'Noite', presenca: 95 },
  { matricula: '26.0233', nome: 'Lucas Ribeiro', turma: '3ª Série A', turno: 'Manhã', presenca: 98 },
  { matricula: '26.0240', nome: 'Mariana Pires', turma: '3ª Série A', turno: 'Manhã', presenca: 93 },
  { matricula: '26.0307', nome: 'Marina Duarte', turma: '2ª Série B', turno: 'Manhã', presenca: 74 },
  { matricula: '26.0311', nome: 'Rafael Gomes', turma: '2ª Série B', turno: 'Manhã', presenca: 90 },
  { matricula: '26.0102', nome: 'Sofia Cardoso', turma: '1ª Série C', turno: 'Tarde', presenca: 88 },
  { matricula: '26.0109', nome: 'Thiago Nunes', turma: '1ª Série C', turno: 'Tarde', presenca: 70 },
];

export const professores = [
  { nome: 'Ricardo Lima', disciplina: 'Matemática', turmas: '3ª E, 3ª A, 2ª B, 1ª C', situacao: 'atrasado' },
  { nome: 'Camila Torres', disciplina: 'Química', turmas: '3ª E, 3ª A, 2ª B', situacao: 'atrasado' },
  { nome: 'André Souza', disciplina: 'História', turmas: '3ª E, 1ª C', situacao: 'hoje' },
  { nome: 'Juliana Prado', disciplina: 'Língua Portuguesa', turmas: '3ª E, 3ª A', situacao: 'em-dia' },
  { nome: 'Marcos Vieira', disciplina: 'Física', turmas: '3ª E, 2ª B', situacao: 'em-dia' },
  { nome: 'Patrícia Ramos', disciplina: 'Biologia', turmas: '3ª E, 3ª A, 1ª C', situacao: 'em-dia' },
];
