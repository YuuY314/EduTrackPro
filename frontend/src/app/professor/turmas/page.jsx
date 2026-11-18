'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TituloPagina from '@/src/components/TituloPagina';
import Etiqueta from '@/src/components/Etiqueta';
import { api, lerSessao } from '@/src/lib/api';
import { corDaNota } from '@/src/lib/utils';

export default function MinhasTurmas() {
  const [turmas, setTurmas] = useState([]);

  useEffect(() => {
    document.title = 'Minhas turmas · EduTrackPro';

    async function carregarTurmas() {
      try {
        const sessao = lerSessao();
        const idProfessor = sessao?.usuario?.id_professor;
          if (!idProfessor) return;

        const resposta = await api(`/turma_disciplina_professor/professor/${idProfessor}`);
        setTurmas(resposta?.dados || []);
      } catch (e) {
        console.error('Erro ao carregar turmas:', e);
      }
    }

    carregarTurmas();
  }, []);
  
  return (
    <>
      <TituloPagina titulo="Minhas turmas" voltarPara="/professor" voltarNome="Início" />

      <div className="turmas">
        {turmas.map((turma) => (
          <div key={turma.id_tdp} className="cartao cartao-conteudo turma">
            <div>
              <h3>{turma.nome}</h3>
              <p>{turma.turno} · {turma.disciplina}</p>
            </div>

            <div className="turma-numeros">
              <div><strong>{turma.alunos}</strong><small>ALUNOS</small></div>
              <div>
                <strong>
                  <Etiqueta cor={corDaNota(turma.media ?? 0)}>
                    {turma.media !== null ? turma.media : '—'}
                  </Etiqueta>
                </strong>
                <small>MÉDIA</small>
              </div>
              <div><strong>{turma.presenca !== null ? `${turma.presenca}%` : '—'}</strong><small>PRESENÇA</small></div>
            </div>

            <div className="turma-botoes">
              <Link className="botao botao-pequeno" href="/professor/chamada">Chamada</Link>
              <Link className="botao botao-pequeno botao-contorno" href="/professor/notas">Notas</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
