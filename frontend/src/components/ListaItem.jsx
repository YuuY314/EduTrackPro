export default function ListaItem({ hora, titulo, detalhe, children }) {
  return (
    <div className="lista-item">
      {hora && <time>{hora}</time>}
      <div>
        {titulo}
        <small>{detalhe}</small>
      </div>
      {children}
    </div>
  );
}
