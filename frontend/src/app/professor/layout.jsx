import Header from '@/src/components/Header';
import BoasVindas from '@/src/components/BoasVindas';
import AreaProtegida from '@/src/components/AreaProtegida';

export default function Layout({ children }) {
  return (
    <AreaProtegida perfil="professor">
      <Header perfil="professor" />
      <main className="container">
        <BoasVindas perfil="professor" />
        {children}
      </main>
    </AreaProtegida>
  );
}
