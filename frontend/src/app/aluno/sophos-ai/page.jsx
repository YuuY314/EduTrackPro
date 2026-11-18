import TituloPagina from '@/src/components/TituloPagina';
import SophosChat from '@/src/components/SophosChat';

export const metadata = { title: 'SophosAI · EduTrackPro' };

export default function SophosAI() {
  return (
    <>
      <TituloPagina titulo="SophosAI" voltarPara="/aluno" voltarNome="Início" />
      <SophosChat perfil="aluno" />
    </>
  );
}
