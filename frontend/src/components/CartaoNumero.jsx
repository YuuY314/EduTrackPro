import Link from 'next/link';

export default function CartaoNumero({ numero, texto, nota, href, alerta, palavra }) {
  const classes = `cartao numero ${alerta ? 'alerta' : ''}`;

  const conteudo = (
    <>
      <strong className={palavra ? 'texto' : ''}>{numero}</strong>
      <span>{texto}</span>
      {nota && <p>{nota}</p>}
    </>
  );

  if (href) {
    return <Link className={classes} href={href}>{conteudo}</Link>;
  }
  return <div className={classes}>{conteudo}</div>;
}
