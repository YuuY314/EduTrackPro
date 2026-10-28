import CartaoNumero from '@/components/CartaoNumero';
import Agenda from '@/components/Agenda';
import { agenda } from '@/lib/dados';

export const metadata = { title: 'Início · Sophos Academy' };

export default function InicioAluno() {
  return (
    <div className="inicio-aluno">
      <CartaoNumero numero="3" texto="Pendências" />
      <CartaoNumero numero="133" texto="Mensagens não lidas" href="#" />

      <div className="cartao cartao-conteudo agenda">
        <h3>Agenda</h3>
        <Agenda eventos={agenda} />
      </div>

      <CartaoNumero
        numero="2"
        texto="Faltas"
        nota="Sua presença é muito importante."
        href="/aluno/presenca"
      />
      <CartaoNumero numero="Boletim" texto="e avaliações" href="/aluno/boletim" palavra />
    </div>
  );
}
