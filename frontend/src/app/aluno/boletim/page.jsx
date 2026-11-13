'use client';

import { useEffect, useState } from 'react';
import TituloPagina from '@/src/components/TituloPagina';
import Etiqueta from '@/src/components/Etiqueta';
import { buscarMeuBoletim } from '@/src/lib/api';
import { corDaNota } from '@/src/lib/utils';
import LoadingTips from '@/src/components/LoadingTips';

const colunas = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Conselho final'];

function formatarDisciplinas(disciplinas = []) {
  return disciplinas.map((item) => {
    const notasBimestres = item.notas ?? [null, null, null, null];
    const notasLancadas = notasBimestres.filter((n) => n !== null);

    const conselhoFinal =
      notasLancadas.length > 0
        ? Number((notasLancadas.reduce((acc, val) => acc + Number(val), 0) / notasLancadas.length).toFixed(1))
        : null;

    return {
      componente: item.disciplina,
      notas: [...notasBimestres, conselhoFinal],
    };
  });
}

export default function Boletim() {
  const [linhasBoletim, setLinhasBoletim] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarMeuBoletim();
        setLinhasBoletim(formatarDisciplinas(dados?.disciplinas));
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
            {linhasBoletim.map((linha) => (
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
