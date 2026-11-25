'use client';

import { useEffect, useState } from 'react';
import CartaoNumero from '@/src/components/CartaoNumero';
import ListaItem from '@/src/components/ListaItem';
import Etiqueta from '@/src/components/Etiqueta';
import TesteEmail from '@/src/components/TesteEmail';
import { admin, nomeTurma } from '@/src/lib/api';

export default function Painel() {
  const [r, setR] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    admin.resumo().then(setR).catch((e) => setErro(e.message));
  }, []);

  const n = (v) => (r ? String(v ?? '–') : '…');

  return (
    <>
      <div className="grade-4">
        <CartaoNumero numero={n(r?.alunos)} texto="Alunos matriculados" href="/admin/alunos" />
        <CartaoNumero numero={r ? (r.frequenciaMedia === null ? '–' : `${r.frequenciaMedia}%`) : '…'} texto="Frequência média da escola" />
        <CartaoNumero numero={n(r?.turmasPendentes)} texto="Turmas com nota pendente" href="/admin/professores" alerta />
        <CartaoNumero numero={n(r?.professores)} texto="Professores" href="/admin/professores" />
      </div>

      {erro && <p className="dica">{erro}</p>}

      <div className="grade-2">
        <div className="cartao cartao-conteudo">
          <h3>Alunos em risco de reprovação por falta</h3>
          {(r?.alunosRisco ?? []).map((a) => (
            <ListaItem key={a.id_aluno} titulo={a.nome} detalhe={`${nomeTurma(a.turma)} · ${a.turno}`}>
              <Etiqueta cor={a.presenca < 70 ? 'ruim' : 'atencao'}>{a.presenca}%</Etiqueta>
            </ListaItem>
          ))}
          {r && (r.alunosRisco ?? []).length === 0 && <p className="dica">Nenhum aluno abaixo de 75%.</p>}
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Lançamentos atrasados</h3>
          {(r?.lancamentosAtrasados ?? []).map((p) => (
            <ListaItem key={p.id_professor} titulo={`Prof. ${p.nome}`} detalhe={`${p.disciplina} · ${p.pendentes} turma(s) sem nota`}>
              <Etiqueta cor="ruim">Atrasado</Etiqueta>
            </ListaItem>
          ))}
          {r && (r.lancamentosAtrasados ?? []).length === 0 && <p className="dica">Nenhum lançamento atrasado.</p>}
        </div>
      </div>

      <TesteEmail />
    </>
  );
}
