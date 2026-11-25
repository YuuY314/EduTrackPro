'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CartaoNumero from '@/src/components/CartaoNumero';
import ListaItem from '@/src/components/ListaItem';
import Etiqueta from '@/src/components/Etiqueta';
import LoadingTips from '@/src/components/LoadingTips';
import { buscarDashboardProfessor } from '@/src/lib/api';

//pega a data atual do computador e coloca em um formato curto
function formatarHojeCabecalho() {
  const agora = new Date();
  const semana = agora.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const diaMes = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${semana}, ${diaMes}`;
}

//estados, busca inicial e erro
export default function InicioProfessor() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    document.title = 'Início · EduTrackPro';
    let ativo = true;

    async function carregar() {
      try {
        const resultado = await buscarDashboardProfessor();
        if (ativo) setDados(resultado);
      } catch (e) {
        if (ativo) setErro(e);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) throw erro;

  if (!dados) {
    return <LoadingTips texto="Carregando seu painel..." />;
  }
  return (
    <>
      <div className="grade-4">
        <CartaoNumero numero={String(dados.totalAulasHoje)} texto="Aulas hoje" />
        <CartaoNumero
          numero={String(dados.turmasSemNota)}
          texto={`Turmas com notas pendentes`}
          href="/professor/notas"
          alerta={dados.turmasSemNota > 0}
        />
        <CartaoNumero numero={String(dados.totalTurmas)} texto="Turmas" href="/professor/turmas" />
        <CartaoNumero
          numero={String(dados.totalBaixaFrequencia)}
          texto="Alunos abaixo de 75% nas suas aulas"
        />
      </div>

      <div className="grade-2">
        <div className="cartao cartao-conteudo">
          <h3>Aulas de hoje · {formatarHojeCabecalho()}</h3>
          {dados.aulasHoje.length === 0 ? (
            <p className="dica">Nenhuma aula agendada para hoje.</p>
          ) : (
            dados.aulasHoje.map((aula) => (
              <ListaItem key={aula.id} hora={aula.hora} titulo={aula.turma} detalhe={aula.detalhe}>
                <Link className="botao botao-pequeno" href={aula.link}>
                  Fazer chamada
                </Link>
              </ListaItem>
            ))
          )}
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Frequência baixa em {dados.disciplinaPrincipal}</h3>
          {dados.alunosBaixaFrequencia.length === 0 ? (
            <p className="dica">Nas suas aulas, todos os alunos estão com presença igual ou acima de 75%.</p>
          ) : (
            dados.alunosBaixaFrequencia.map((aluno) => (
              <ListaItem key={aluno.id} titulo={aluno.nome} detalhe={aluno.detalhe}>
                <Etiqueta cor={aluno.frequencia < 70 ? 'ruim' : 'atencao'}>
                  {aluno.frequencia}%
                </Etiqueta>
              </ListaItem>
            ))
          )}
        </div>
      </div>
    </>
  );
}