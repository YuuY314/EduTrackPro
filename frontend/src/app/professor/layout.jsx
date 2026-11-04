import Header from '@/src/components/Header';
import BoasVindas from '@/src/components/BoasVindas';

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
