import Header from '@/components/Header';
import BoasVindas from '@/components/BoasVindas';

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
