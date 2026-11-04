import TituloPagina from '@/src/components/TituloPagina';
import Professores from './Professores';

export const metadata = { title: 'Professores · Sophos Academy' };

export default function ProfessoresPage() {
  return (
    <>
      <TituloPagina titulo="Professores" voltarPara="/admin" voltarNome="Painel" />
      <Professores />
    </>
  );
}
