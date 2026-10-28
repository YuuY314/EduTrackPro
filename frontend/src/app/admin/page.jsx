import CartaoNumero from '@/components/CartaoNumero';
import ListaItem from '@/components/ListaItem';
import Etiqueta from '@/components/Etiqueta';

export const metadata = { title: 'Painel · Sophos Academy' };

export default function Painel() {
  return (
    <>
      <div className="grade-4">
        <CartaoNumero numero="1.248" texto="Alunos matriculados" href="/admin/alunos" />
        <CartaoNumero numero="91%" texto="Frequência média da escola" />
        <CartaoNumero numero="7" texto="Turmas com nota pendente" href="/admin/professores" alerta />
        <CartaoNumero numero="64" texto="Professores" href="/admin/professores" />
      </div>

      <div className="grade-2">
        <div className="cartao cartao-conteudo">
          <h3>Alunos em risco de reprovação por falta</h3>
          <ListaItem titulo="Eduarda Lima" detalhe="3ª Série E · Noite">
            <Etiqueta cor="ruim">68%</Etiqueta>
          </ListaItem>
          <ListaItem titulo="Thiago Nunes" detalhe="1ª Série C · Tarde">
            <Etiqueta cor="ruim">70%</Etiqueta>
          </ListaItem>
          <ListaItem titulo="Felipe Rocha" detalhe="3ª Série E · Noite">
            <Etiqueta cor="atencao">73%</Etiqueta>
          </ListaItem>
          <ListaItem titulo="Marina Duarte" detalhe="2ª Série B · Manhã">
            <Etiqueta cor="atencao">74%</Etiqueta>
          </ListaItem>
        </div>

        <div className="cartao cartao-conteudo">
          <h3>Lançamentos atrasados</h3>
          <ListaItem titulo="Prof. Ricardo Lima" detalhe="Matemática · 2 turmas">
            <Etiqueta cor="ruim">Atrasado</Etiqueta>
          </ListaItem>
          <ListaItem titulo="Profa. Camila Torres" detalhe="Química · 3 turmas">
            <Etiqueta cor="ruim">Atrasado</Etiqueta>
          </ListaItem>
          <ListaItem titulo="Prof. André Souza" detalhe="História · 2 turmas">
            <Etiqueta cor="atencao">Vence hoje</Etiqueta>
          </ListaItem>
        </div>
      </div>
    </>
  );
}
