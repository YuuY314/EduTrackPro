'use client';

import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';

// Carregado sob demanda: recharts e mathjs são pesados e só importam quando há gráfico.
const GraficoIA = dynamic(() => import('@/src/components/GraficoIA'), { ssr: false });

const TIPOS_GRAFICO = /"tipo"\s*:\s*"(barras|linha|pizza|funcao)"/;

// Extrai a linguagem e o texto do bloco de código que o react-markdown entrega dentro do <pre>.
function lerBlocoDeCodigo(children) {
  const filho = Array.isArray(children) ? children[0] : children;
  const classe = filho?.props?.className ?? '';
  const codigo = String(filho?.props?.children ?? '').trim();
  return { classe, codigo };
}

export default function Markdown({ texto }) {
  // Corrige alguns resíduos de formatação gerados pelo Gemini.
  const conteudo = (texto || '')
    .replace(/\r\n/g, '\n')
    .replace(/\\---/g, '---')
    .replace(/&#x20;/gi, ' ');

  return (
    <div className="markdown-conteudo">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          remarkBreaks,
        ]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h3>{children}</h3>,
          h3: ({ children }) => <h4>{children}</h4>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Blocos ```grafico (ou ```json com cara de gráfico) viram gráfico de verdade.
          // Os demais blocos de código continuam como antes.
          pre: ({ children, ...props }) => {
            const { classe, codigo } = lerBlocoDeCodigo(children);

            const ehGrafico =
              /language-grafico/.test(classe) ||
              (/language-json/.test(classe) && TIPOS_GRAFICO.test(codigo));

            if (ehGrafico) return <GraficoIA json={codigo} />;
            return <pre {...props}>{children}</pre>;
          },
        }}
      >
        {conteudo}
      </ReactMarkdown>
    </div>
  );
}
