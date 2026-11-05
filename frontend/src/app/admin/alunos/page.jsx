import TituloPagina from '@/src/components/TituloPagina';
import Alunos from './Alunos';

export const metadata = { title: 'Alunos · EduTrackPro' };

export default function AlunosPage() {
  return (
    <>
      <TituloPagina titulo="Alunos" voltarPara="/admin" voltarNome="Painel" />
      <Alunos />
    </>
  );
}
