import TituloPagina from '@/src/components/TituloPagina';
import Etiqueta from '@/src/components/Etiqueta';
import { boletim } from '@/src/lib/dados';
import { corDaNota } from '@/src/lib/utils';

export const metadata = { title: 'Boletim · Sophos Academy' };

const colunas = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Conselho final'];

export default function Boletim() {
  return (
    <>
      <TituloPagina titulo="Boletim" voltarPara="/aluno" voltarNome="Início" />

      <div className="cartao tabela-rolagem tabela-larga tabela-escura">
        <table>
          <thead>
            <tr>
              <th>Componente</th>
              {colunas.map((coluna) => (
                <th key={coluna} className="centro">{coluna}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {boletim.map((linha) => (
              <tr key={linha.componente}>
                <td>{linha.componente}</td>
                {linha.notas.map((nota, i) => (
                  <td key={i} className="centro">
                    <Etiqueta cor={corDaNota(nota)}>{nota ?? '–'}</Etiqueta>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
