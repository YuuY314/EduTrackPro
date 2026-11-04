import Header from '@/src/components/Header';
import BoasVindas from '@/src/components/BoasVindas';

export default function Layout({ children }) {
  return (
    <>
      <Header perfil="admin" />
      <main className="container">
        <BoasVindas perfil="admin" />
        {children}
      </main>
    </>
  );
}
