import Header from '@/src/components/Header';
import BoasVindas from '@/src/components/BoasVindas';

export default function Layout({ children }) {
  return (
    <>
      <Header perfil="aluno" />
      <main className="container">
        <BoasVindas perfil="aluno" />
        {children}
      </main>
    </>
  );
}
