// =====================================================================
// services/alunos.service.js
// Regras da área do aluno (/alunos/me/*) e do cadastro de alunos (admin).
//
// Conceito-chave: o aluno NÃO tem "seu cronograma" guardado. Descobrimos
// a turma dele e buscamos o cronograma/avisos/tarefas DA TURMA. Por isso,
// mudar um aluno de turma muda tudo automaticamente.
// =====================================================================

import { AppError } from "../utils/AppError.js";
import { gerarHash } from "../utils/senha.js";

// Percentual de presença (1 casa decimal). Sem aulas ainda = null.
function percentualPresenca(totalAulas, faltas) {
  if (!totalAulas) return null;
  return Math.round((1000 * (totalAulas - faltas)) / totalAulas) / 10;
}

export function criarAlunosService({
  alunosModel,
  turmasModel,
  horariosModel,
  tarefasModel,
  avisosModel,
}) {
  // Transforma a linha "achatada" do SQL em um objeto organizado.
  function formatarFicha(l) {
    return {
      id_aluno: l.id_aluno,
      matricula: l.matricula,
      nome: l.nome,
      cpf: l.cpf,
      endereco: l.endereco,
      email_institucional: l.email_institucional,
      turma: { id_turma: l.id_turma, nome: l.turma, periodo: l.periodo },
      responsavel: {
        id_responsavel: l.id_responsavel,
        nome: l.responsavel_nome,
        cpf: l.responsavel_cpf,
        telefone: l.responsavel_telefone,
        email: l.responsavel_email,
        parentesco: l.responsavel_parentesco,
      },
    };
  }

  // Busca a linha do aluno ou lança 404. Reaproveitado em vários métodos.
  async function obterAluno(idAluno) {
    const linha = await alunosModel.buscarPorId(idAluno);
    if (!linha) throw new AppError("Aluno não encontrado", 404);
    return linha;
  }

  // Declarado como constante para poder ser chamado por outros métodos
  // do próprio service (home usa frequencia, por exemplo).
  const servico = {
    // ======================== área do aluno ========================

    async ficha(idAluno) {
      return formatarFicha(await obterAluno(idAluno));
    },

    async horarios(idAluno) {
      const aluno = await obterAluno(idAluno);
      return horariosModel.listarPorTurma(aluno.id_turma);
    },

    async tarefas(idAluno) {
      const aluno = await obterAluno(idAluno);
      return tarefasModel.listarPorTurma(aluno.id_turma);
    },

    async avisos(idAluno) {
      const aluno = await obterAluno(idAluno);
      return avisosModel.listarParaTurma(aluno.id_turma);
    },

    // Boletim: para cada disciplina, as avaliações e a média por bimestre.
    //   [{ disciplina: "Matemática",
    //      bimestres: { 3: { media: 7.4, avaliacoes: [{ titulo, peso, nota }] } } }]
    // "idProfessor" (opcional) limita às disciplinas desse professor.
    async boletim(idAluno, idProfessor = null) {
      const [medias, notas] = await Promise.all([
        alunosModel.boletimMedias(idAluno),
        alunosModel.notasDetalhadas(idAluno, idProfessor),
      ]);

      const porDisciplina = new Map();

      // 1) monta a estrutura com as avaliações
      for (const n of notas) {
        if (!porDisciplina.has(n.disciplina)) {
          porDisciplina.set(n.disciplina, { disciplina: n.disciplina, bimestres: {} });
        }
        const disc = porDisciplina.get(n.disciplina);
        if (!disc.bimestres[n.bimestre]) disc.bimestres[n.bimestre] = { media: null, avaliacoes: [] };

        disc.bimestres[n.bimestre].avaliacoes.push({
          id_avaliacao: n.id_avaliacao,
          titulo: n.titulo,
          peso: n.peso,
          data: n.data,
          nota: n.valor, // null = ainda não lançada
        });
      }

      // 2) encaixa a média que veio da view vw_boletim
      for (const m of medias) {
        const disc = porDisciplina.get(m.disciplina);
        if (disc && disc.bimestres[m.bimestre]) disc.bimestres[m.bimestre].media = m.media;
      }

      return [...porDisciplina.values()];
    },

    // Frequência: total geral, por disciplina e lista de faltas.
    async frequencia(idAluno, idProfessor = null) {
      const [porDisciplina, faltasDetalhe] = await Promise.all([
        alunosModel.frequenciaPorDisciplina(idAluno, idProfessor),
        alunosModel.listarFaltas(idAluno, idProfessor),
      ]);

      const totalAulas = porDisciplina.reduce((soma, d) => soma + d.total_aulas, 0);
      const totalFaltas = porDisciplina.reduce((soma, d) => soma + d.faltas, 0);

      return {
        total_aulas: totalAulas,
        faltas: totalFaltas,
        percentual_presenca: percentualPresenca(totalAulas, totalFaltas),
        por_disciplina: porDisciplina.map((d) => ({
          disciplina: d.disciplina,
          total_aulas: d.total_aulas,
          faltas: d.faltas,
          percentual_presenca: percentualPresenca(d.total_aulas, d.faltas),
        })),
        faltas_detalhe: faltasDetalhe,
      };
    },

    // Resumo da tela inicial (parecido com a home da Sala do Futuro).
    async home(idAluno) {
      const aluno = await obterAluno(idAluno);

      // Promise.all roda as 3 consultas ao mesmo tempo (mais rápido que uma por vez).
      const [freq, tarefas, avisos] = await Promise.all([
        servico.frequencia(idAluno),
        tarefasModel.listarPorTurma(aluno.id_turma),
        avisosModel.listarParaTurma(aluno.id_turma),
      ]);

      // Data de hoje no formato AAAA-MM-DD, no fuso do servidor.
      // ("sv-SE" é um truque: esse idioma já formata datas desse jeito.)
      const hoje = new Date().toLocaleDateString("sv-SE");

      // Como ainda não existe "entrega de tarefa", "pendência" = tarefa
      // cujo prazo ainda não passou.
      const pendentes = tarefas.filter((t) => t.data_entrega >= hoje);

      return {
        aluno: { nome: aluno.nome, turma: aluno.turma, periodo: aluno.periodo },
        pendencias: pendentes.length,
        faltas: freq.faltas,
        percentual_presenca: freq.percentual_presenca,
        proximas_tarefas: pendentes.slice(0, 5),
        ultimos_avisos: avisos.slice(0, 3),
      };
    },

    // ========================= cadastro (admin) =========================

    listar() {
      return alunosModel.listarTodos();
    },

    async criar(dados) {
      // Mensagem clara se a turma não existir (em vez do erro genérico do banco).
      if (!(await turmasModel.buscarPorId(dados.id_turma))) {
        throw new AppError("Turma não encontrada", 404);
      }

      const idAluno = await alunosModel.criar({
        aluno: dados,
        idResponsavel: dados.id_responsavel,
        responsavel: dados.responsavel,
        senhaHash: await gerarHash(dados.senha), // nunca salvar a senha pura
      });
      return { id_aluno: idAluno };
    },

    async atualizar(idAluno, campos) {
      await obterAluno(idAluno); // 404 se não existir
      if (campos.id_turma && !(await turmasModel.buscarPorId(campos.id_turma))) {
        throw new AppError("Turma não encontrada", 404);
      }
      await alunosModel.atualizar(idAluno, campos);
    },

    async remover(idAluno) {
      await obterAluno(idAluno);
      await alunosModel.remover(idAluno);
    },
  };

  return { ...servico, formatarFicha };
}
