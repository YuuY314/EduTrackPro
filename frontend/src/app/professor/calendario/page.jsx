import TituloPagina from '@/src/components/TituloPagina';
import CalendarioProfessor from './CalendarioProfessor';

export const metadata = { title: 'Calendário · EduTrackPro' };

export default function CalendarioProfessorPage() {
  return (
    <>
      <TituloPagina titulo="Calendário" voltarPara="/professor" voltarNome="Início" />
      <CalendarioProfessor />
    </>
  );
}