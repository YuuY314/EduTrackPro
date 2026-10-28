'use client';

import { useState } from 'react';
import Etiqueta from '@/components/Etiqueta';
import { professores } from '@/lib/dados';

const situacoes = {
  'atrasado': { cor: 'ruim', texto: 'Atrasado' },
  'hoje': { cor: 'atencao', texto: 'Vence hoje' },
  'em-dia': { cor: 'bom', texto: 'Em dia' },
};

export default function Professores() {
  const [lembrados, setLembrados] = useState([]);

  return (
    <div className="cartao tabela-rolagem tabela-larga tabela-escura">
      <table>
        <thead>
          <tr>
            <th>Professor</th>
            <th>Disciplina</th>
            <th>Turmas</th>
            <th className="centro">Notas do 3º bimestre</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {professores.map((p) => {
            const situacao = situacoes[p.situacao];
            const lembrado = lembrados.includes(p.nome);
            return (
              <tr key={p.nome}>
                <td>{p.nome}</td>
                <td>{p.disciplina}</td>
                <td>{p.turmas}</td>
                <td className="centro"><Etiqueta cor={situacao.cor}>{situacao.texto}</Etiqueta></td>
                <td>
                  {p.situacao !== 'em-dia' && (
                    <button
                      className="botao botao-pequeno botao-contorno"
                      disabled={lembrado}
                      onClick={() => setLembrados([...lembrados, p.nome])}
                    >
                      {lembrado ? 'Lembrete enviado' : 'Enviar lembrete'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
