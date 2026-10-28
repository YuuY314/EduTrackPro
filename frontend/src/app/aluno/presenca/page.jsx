import TituloPagina from '@/components/TituloPagina';
import Etiqueta from '@/components/Etiqueta';
import { presencaPorComponente } from '@/lib/dados';
import { corDaPresenca } from '@/lib/utils';

export const metadata = { title: 'Presença · Sophos Academy' };

export default function Presenca() {
  return (
    <>
      <TituloPagina titulo="Presença" voltarPara="/aluno" voltarNome="Início" />

      <div className="presenca">
        <div className="presenca-coluna">
          <div className="cartao resumo-faltas">
            <strong>2</strong> <span>faltas no bimestre atual</span>
            <p>de um total de 46 aulas</p>
            <div className="faixa">menos de 5%</div>
          </div>

          <div className="cartao">
            <div className="cartao-titulo">Últimos dias com falta</div>
            <div className="dia-falta">
              <strong>Qua. 7/10</strong>
              <span>2 aulas</span>
              <span className="fraco">Sem ciência do responsável</span>
            </div>
            <button className="botao-redondo">Ver todos</button>
          </div>
        </div>

        <div className="cartao">
          <div className="cartao-titulo escuro">Presenças por componente</div>
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Componente</th>
                  <th className="centro">Faltas</th>
                  <th className="centro">% presença</th>
                </tr>
              </thead>
              <tbody>
                {presencaPorComponente.map((linha) => (
                  <tr key={linha.componente}>
                    <td>{linha.componente}</td>
                    <td className="centro">{linha.faltas}</td>
                    <td className="centro">
                      <Etiqueta cor={corDaPresenca(linha.presenca)}>{linha.presenca}%</Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
