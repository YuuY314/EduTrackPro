import TituloPagina from '@/components/TituloPagina';
import Alunos from './Alunos';

export const metadata = { title: 'Alunos · Sophos Academy' };

export default function AlunosPage() {
  return (
    <>
      <TituloPagina titulo="Alunos" voltarPara="/admin" voltarNome="Painel" />
      <Alunos />
    </>
  );
}
