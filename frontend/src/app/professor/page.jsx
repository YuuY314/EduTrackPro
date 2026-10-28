import Link from 'next/link';
import CartaoNumero from '@/components/CartaoNumero';
import ListaItem from '@/components/ListaItem';
import Etiqueta from '@/components/Etiqueta';
import { aulasDeHoje } from '@/lib/dados';

export const metadata = { title: 'Início · Sophos Academy' };

export default function InicioProfessor() {
  return (
    <>
      <div className="grade-4">
        <CartaoNumero numero="3" texto="Aulas hoje" />
        <CartaoNumero numero="2" texto="Turmas sem nota no 3º bimestre" href="/professor/notas" alerta />
        <CartaoNumero numero="4" texto="Turmas" href="/professor/turmas" />
        <CartaoNumero numero="3" texto="Alunos abaixo de 75% de presença" />
      </div>

      <div className="grade-2">
        <div className="cartao cartao-conteudo">
          <h3>Aulas de hoje · seg, 26/10</h3>
          {aulasDeHoje.map((aula) => (
            <ListaItem key={aula.hora} hora={aula.hora} titulo={aula.turma} detalhe={aula.detalhe}>
              <Link className="botao botao-pequeno" href="/professor/chamada">Fazer chamada</Link>
            </ListaItem>
          ))}
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Frequência baixa em Matemática</h3>
          <ListaItem titulo="Eduarda Lima" detalhe="3ª Série E · Noite">
            <Etiqueta cor="ruim">68%</Etiqueta>
          </ListaItem>
          <ListaItem titulo="Felipe Rocha" detalhe="3ª Série E · Noite">
            <Etiqueta cor="atencao">73%</Etiqueta>
          </ListaItem>
          <ListaItem titulo="Gabriel Araujo" detalhe="3ª Série E · Noite">
            <Etiqueta cor="atencao">71%</Etiqueta>
          </ListaItem>
        </div>
      </div>
    </>
  );
}
