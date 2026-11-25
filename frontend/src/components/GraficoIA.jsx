'use client';
import { useMemo } from 'react';
import { compile } from 'mathjs';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const CORES = ['#7f8cff', '#f2a65a', '#4ec9a0', '#e86f8a', '#b18cf0'];
const EIXO = '#9aa3d6';
const tooltipStyle = { background: '#1b1e3d', border: '1px solid #3a3f78', borderRadius: 8, color: '#fff' };

function pontosDaFuncao({ expressao, xMin = -10, xMax = 10 }) {
  const f = compile(String(expressao).slice(0, 120)); // limita o tamanho da expressão
  const passo = (xMax - xMin) / 200;
  const pontos = [];
  for (let x = xMin; x <= xMax; x += passo) {
    const y = f.evaluate({ x });
    if (Number.isFinite(y)) pontos.push({ x: +x.toFixed(3), y: +y.toFixed(3) });
  }
  return pontos;
}

export default function GraficoIA({ json }) {
  const resultado = useMemo(() => {
    try {
      const spec = JSON.parse(json);
      if (spec.tipo === 'funcao') return { spec, dados: pontosDaFuncao(spec) };
      if (!Array.isArray(spec.dados)) throw new Error('sem dados');
      return { spec, dados: spec.dados.slice(0, 50) };
    } catch {
      return null;
    }
  }, [json]);

  // JSON quebrado: cai para o bloco de código, sem derrubar a tela.
  if (!resultado) return <pre><code>{json}</code></pre>;

  const { spec, dados } = resultado;
  const ehFuncao = spec.tipo === 'funcao';

  const eixos = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#3a3f78" />
      <XAxis dataKey={ehFuncao ? 'x' : 'nome'} type={ehFuncao ? 'number' : 'category'}
             domain={ehFuncao ? ['dataMin', 'dataMax'] : undefined} stroke={EIXO} tick={{ fill: EIXO, fontSize: 12 }} />
      <YAxis stroke={EIXO} tick={{ fill: EIXO, fontSize: 12 }} />
      <Tooltip contentStyle={tooltipStyle} />
    </>
  );

  return (
    <figure style={{ margin: '10px 0' }}>
      {spec.titulo && <figcaption style={{ fontWeight: 700, marginBottom: 6 }}>{spec.titulo}</figcaption>}
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          {spec.tipo === 'pizza' ? (
            <PieChart>
              <Pie data={dados} dataKey="valor" nameKey="nome" label>
                {dados.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          ) : spec.tipo === 'barras' ? (
            <BarChart data={dados}>{eixos}<Bar dataKey="valor" fill={CORES[0]} radius={[4, 4, 0, 0]} /></BarChart>
          ) : (
            <LineChart data={dados}>{eixos}
              <Line type="monotone" dataKey={ehFuncao ? 'y' : 'valor'} stroke={CORES[0]} dot={false} strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
