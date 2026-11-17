'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';

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
        }}
      >
        {conteudo}
      </ReactMarkdown>
    </div>
  );
}
