import Header from '@/components/Header';
import BoasVindas from '@/components/BoasVindas';

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
