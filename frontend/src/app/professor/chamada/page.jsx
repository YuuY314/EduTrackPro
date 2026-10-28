import TituloPagina from '@/components/TituloPagina';
import Chamada from './Chamada';

export const metadata = { title: 'Chamada · Sophos Academy' };

export default function ChamadaPage() {
  return (
    <>
      <TituloPagina titulo="Chamada" voltarPara="/professor" voltarNome="Início" />
      <Chamada />
    </>
  );
}
