import Header from '@/src/components/Header';
import BoasVindas from '@/src/components/BoasVindas';
import AreaProtegida from '@/src/components/AreaProtegida';

export default function Layout({ children }) {
  return (
    <AreaProtegida perfil="admin">
      <Header perfil="admin" />
      <main className="container">
        <BoasVindas perfil="admin" />
        {children}
      </main>
    </AreaProtegida>
  );
}
