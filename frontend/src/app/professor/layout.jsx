import Header from '@/components/Header';
import BoasVindas from '@/components/BoasVindas';

export default function Layout({ children }) {
  return (
    <>
      <Header perfil="professor" />
      <main className="container">
        <BoasVindas perfil="professor" />
        {children}
      </main>
    </>
  );
}
