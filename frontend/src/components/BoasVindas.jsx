import { perfis } from '@/lib/dados';

export default function BoasVindas({ perfil }) {
  const usuario = perfis[perfil];

  return (
    <div className="boas-vindas">
      <span className="avatar">{usuario.iniciais}</span>
      <div>
        <h2>Olá, <strong>{usuario.saudacao}</strong></h2>
        <p>{usuario.saudacaoDetalhe}</p>
      </div>
    </div>
  );
}
