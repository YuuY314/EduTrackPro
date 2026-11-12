export default function Etiqueta({ cor, children }) {
  return <span className={`etiqueta ${cor}`}>{children}</span>;
}
