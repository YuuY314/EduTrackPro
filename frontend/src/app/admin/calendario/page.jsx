import TituloPagina from '@/src/components/TituloPagina';
import Calendario from './Calendario';

export const metadata = { title: 'Calendário · EduTrackPro' };

export default function CalendarioPage() {
  return (
    <>
      <TituloPagina titulo="Calendário" voltarPara="/admin" voltarNome="Painel" />
      <Calendario />
    </>
  );
}
