import TituloPagina from '@/src/components/TituloPagina';
import Professores from './Professores';

export const metadata = { title: 'Professores · EduTrackPro' };

export default function ProfessoresPage() {
  return (
    <>
      <TituloPagina titulo="Professores" voltarPara="/admin" voltarNome="Painel" />
      <Professores />
    </>
  );
}
