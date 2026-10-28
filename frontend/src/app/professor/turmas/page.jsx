import Link from 'next/link';
import TituloPagina from '@/components/TituloPagina';
import Etiqueta from '@/components/Etiqueta';
import { turmas } from '@/lib/dados';
import { corDaNota } from '@/lib/utils';

export const metadata = { title: 'Minhas turmas · Sophos Academy' };

export default function MinhasTurmas() {
  return (
    <>
      <TituloPagina titulo="Minhas turmas" voltarPara="/professor" voltarNome="Início" />

      <div className="turmas">
        {turmas.map((turma) => (
          <div key={turma.id} className="cartao cartao-conteudo turma">
            <div>
              <h3>{turma.nome}</h3>
              <p>{turma.turno} · {turma.sala}</p>
            </div>

            <div className="turma-numeros">
              <div><strong>{turma.alunos}</strong><small>ALUNOS</small></div>
              <div>
                <strong><Etiqueta cor={corDaNota(turma.media)}>{turma.media}</Etiqueta></strong>
                <small>MÉDIA</small>
              </div>
              <div><strong>{turma.presenca}%</strong><small>PRESENÇA</small></div>
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
