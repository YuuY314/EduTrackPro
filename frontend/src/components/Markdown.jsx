// Renderizador de markdown mínimo e SEGURO (sem dangerouslySetInnerHTML):
// títulos, listas, blocos de código, **negrito**, *itálico* e `código`.
// Suficiente para as respostas do Gemini, sem depender de nenhuma biblioteca.

function inline(texto, chave) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).filter(Boolean);
  return partes.map((p, i) => {
    const k = `${chave}-${i}`;
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={k}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) return <code key={k}>{p.slice(1, -1)}</code>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={k}>{p.slice(1, -1)}</em>;
    return p;
  });
}

export default function Markdown({ texto }) {
  const linhas = texto.replace(/\r\n/g, '\n').split('\n');
  const blocos = [];
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];

    if (linha.trim().startsWith('```')) {
      const codigo = [];
      i++;
      while (i < linhas.length && !linhas[i].trim().startsWith('```')) codigo.push(linhas[i++]);
      i++;
      blocos.push(<pre key={blocos.length}><code>{codigo.join('\n')}</code></pre>);
      continue;
    }

    const titulo = linha.match(/^(#{1,4})\s+(.*)/);
    if (titulo) {
      blocos.push(<h4 key={blocos.length}>{inline(titulo[2], blocos.length)}</h4>);
      i++;
      continue;
    }

    if (/^\s*([*-]|\d+[.)])\s+/.test(linha)) {
      const ordenada = /^\s*\d+[.)]\s+/.test(linha);
      const itens = [];
      while (i < linhas.length && /^\s*([*-]|\d+[.)])\s+/.test(linhas[i])) {
        itens.push(linhas[i].replace(/^\s*([*-]|\d+[.)])\s+/, ''));
        i++;
      }
      const Lista = ordenada ? 'ol' : 'ul';
      blocos.push(
        <Lista key={blocos.length}>
          {itens.map((item, n) => <li key={n}>{inline(item, `${blocos.length}-${n}`)}</li>)}
        </Lista>
      );
      continue;
    }

    if (!linha.trim()) {
      i++;
      continue;
    }

    const paragrafo = [];
    while (
      i < linhas.length &&
      linhas[i].trim() &&
      !linhas[i].trim().startsWith('```') &&
      !/^(#{1,4})\s+/.test(linhas[i]) &&
      !/^\s*([*-]|\d+[.)])\s+/.test(linhas[i])
    ) {
      paragrafo.push(linhas[i++]);
    }
    blocos.push(
      <p key={blocos.length}>
        {paragrafo.map((l, n) => (
          <span key={n}>{n > 0 && <br />}{inline(l, `${blocos.length}-${n}`)}</span>
        ))}
      </p>
    );
  }

  return <>{blocos}</>;
}
