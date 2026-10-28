import { formatarData } from '@/lib/utils';

export default function Agenda({ eventos }) {
  const ordenados = [...eventos].sort((a, b) => a.data.localeCompare(b.data));

  return ordenados.map((evento, i) => {
    const { dia, semana } = formatarData(evento.data);
    return (
      <div className="evento" key={i}>
        <time>{dia}<small>{semana}</small></time>
        <div>
          <strong>{evento.tipo}</strong>
          {evento.descricao && <p>{evento.descricao}</p>}
        </div>
      </div>
    );
  });
}
