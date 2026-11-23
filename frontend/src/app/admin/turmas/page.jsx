import TituloPagina from '@/src/components/TituloPagina';
import Turmas from './Turmas';

export const metadata = { title: 'Turmas · EduTrackPro' };

export default function TurmasAdmin() {
  return (
    <>
      <TituloPagina titulo="Turmas" voltarPara="/admin" voltarNome="Painel" />
      <Turmas />
    </>
  );
}