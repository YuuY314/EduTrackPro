import TituloPagina from '@/components/TituloPagina';
import Calendario from './Calendario';

export const metadata = { title: 'Calendário · Sophos Academy' };

export default function CalendarioPage() {
  return (
    <>
      <TituloPagina titulo="Calendário" voltarPara="/admin" voltarNome="Painel" />
      <Calendario />
    </>
  );
}
