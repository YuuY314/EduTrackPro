import TituloPagina from '@/src/components/TituloPagina';
import Notas from './Notas';

export const metadata = { title: 'Notas · Sophos Academy' };

export default function NotasPage() {
  return (
    <>
      <TituloPagina titulo="Notas" voltarPara="/professor" voltarNome="Início" />
      <Notas />
    </>
  );
}
