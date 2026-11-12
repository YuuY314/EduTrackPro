import Link from 'next/link';

export default function TituloPagina({ titulo, voltarPara, voltarNome }) {
  return (
    <>
      <h1 className="titulo-pagina">{titulo}</h1>
      <p className="caminho">
        <Link href={voltarPara}>{voltarNome}</Link> / {titulo}
      </p>
    </>
  );
}
