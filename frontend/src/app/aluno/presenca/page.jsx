'use client';

import { useEffect, useState } from 'react';
import TituloPagina from '@/src/components/TituloPagina';
import Etiqueta from '@/src/components/Etiqueta';
import LoadingTips from '@/src/components/LoadingTips';
import { buscarMinhaPresenca } from '@/src/lib/api';
import { corDaPresenca } from '@/src/lib/utils';

const DIAS_SEMANA = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];

function formatarDataCurta(isoDate){
  if (!isoDate) return '';
  const [ano, mes, dia] = String(isoDate).slice(0, 10).split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return `${DIAS_SEMANA[data.getDay()]} ${dia}/${mes}`;
}

// Estados que armazenam os dados da API, o status de carregamento/erro e o botão "Ver todos"
export default function Presenca() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarTodosDias, setMostrarTodosDias] = useState(false);

  // Executa uma única vez ao abrir a página para buscar as faltas do aluno logado no backend
  useEffect(() => {
    async function carregar() {
      try {
        const resposta = await buscarMinhaPresenca();
        setDados(resposta);
      } catch (err) {
        setErro(err);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (erro) throw erro;
  if (carregando) return <LoadingTips />;

  const resumo = dados?.resumo ?? { total_aulas: 0, faltas: 0, percentual_presenca: 100 };
  const diasComFalta = dados?.diasComFalta ?? [];
  const presencaPorComponente = dados?.porComponente ?? [];

  const percentualFaltas =
    resumo.total_aulas > 0 ? ((resumo.faltas / resumo.total_aulas) * 100).toFixed(1) : 0;
  const faixaTexto =
    resumo.faltas === 0
      ? 'nenhuma falta'
      : Number(percentualFaltas) < 5
      ? 'menos de 5%'
      : `${percentualFaltas}% de faltas`;

  const diasVisiveis = mostrarTodosDias ? diasComFalta : diasComFalta.slice(0, 1);

  return (
    <>
      <TituloPagina titulo="Presença" voltarPara="/aluno" voltarNome="Início" />

      <div className="presenca">
        <div className="presenca-coluna">
          <div className="cartao resumo-faltas">
            <strong>{resumo.faltas}</strong>{' '} 
            <span>{resumo.faltas === 1 ? 'falta no bimestre atual' : 'faltas no bimestre atual'}</span>
            <p>de um total de {resumo.total_aulas} aulas</p>
            <div className="faixa">{faixaTexto}</div>
          </div>

          <div className="cartao">
            <div className="cartao-titulo">Últimos dias com falta</div>
            {diasVisiveis.length === 0 ? (
              <div className="dia-falta">
                <span className="fraco">Nenhuma falta registrada.</span>
              </div>
            ) : (
              diasVisiveis.map((dia) => (
                <div key={dia.data} className="dia-falta">
                  <strong>{formatarDataCurta(dia.data)}</strong>
                  <span>{dia.qtd_aulas === 1 ? '1 aula' : `${dia.qtd_aulas} aulas`}</span>
                  <span className="fraco">{dia.justificativa || 'Sem ciência do responsável'}</span>
                </div>
              ))
            )}
            {diasComFalta.length > 1 && (
              <button
                className="botao-redondo"
                onClick={() => setMostrarTodosDias((prev) => !prev)}
              >
                {mostrarTodosDias ? 'Ver menos' : 'Ver todos'}
              </button>
            )}
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
