import Header from '@/src/components/Header';
import BoasVindas from '@/src/components/BoasVindas';
import AreaProtegida from '@/src/components/AreaProtegida';

export default function Layout({ children }) {
  return (
    <AreaProtegida perfil="aluno">
      <Header perfil="aluno" />
      <main className="container">
        <BoasVindas perfil="aluno" />
        {children}
      </main>
    </AreaProtegida>
  );
}
