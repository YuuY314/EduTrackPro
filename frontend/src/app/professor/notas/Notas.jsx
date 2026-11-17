'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import Selecao from '@/src/components/Selecao';
import { notasDaTurma, turmas } from '@/src/lib/dados';
import { corDaNota, media } from '@/src/lib/utils';

const avaliacoes = ['Prova 1', 'Prova 2', 'Trabalho'];

const bimestres = [
  { value: '3', label: '3º Bimestre' },
  { value: '4', label: '4º Bimestre' },
];

export default function Notas() {
  const [linhas, setLinhas] = useState(
    notasDaTurma.map((l) => ({ ...l, notas: l.notas.map((n) => n ?? '') }))
  );
  const [mensagem, setMensagem] = useState('');
  const [turma, setTurma] = useState(turmas[0].id);
  const [bimestre, setBimestre] = useState(bimestres[0].value);

  function mudarNota(indiceAluno, indiceNota, valor) {
    const novas = [...linhas];
    novas[indiceAluno] = { ...novas[indiceAluno], notas: [...novas[indiceAluno].notas] };
    novas[indiceAluno].notas[indiceNota] = valor;
    setLinhas(novas);
    setMensagem('');
  }

  function salvar() {
    const emBranco = linhas.filter((l) => media(l.notas) === null).length;
    setMensagem(emBranco ? `Notas salvas · ${emBranco} aluno(s) com nota em branco` : 'Notas salvas');
  }

  return (
    <>
      <div className="filtros">
        <div className="campo largo">
          <label htmlFor="turma">Turma</label>
          <Selecao
            id="turma"
            compacto
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
            opcoes={turmas.map((t) => ({ value: t.id, label: t.nome, detalhe: t.turno }))}
          />
        </div>
        <div className="campo">
          <label htmlFor="bimestre">Bimestre</label>
          <Selecao
            id="bimestre"
            compacto
            value={bimestre}
            onChange={(e) => setBimestre(e.target.value)}
            opcoes={bimestres}
          />
        </div>
      </div>

      <div className="cartao">
        <div className="tabela-rolagem tabela-larga">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                {avaliacoes.map((a) => <th key={a} className="centro">{a}</th>)}
                <th className="centro">Média</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, i) => {
                const m = media(linha.notas);
                return (
                  <tr key={linha.aluno}>
                    <td>{linha.aluno}</td>
                    {linha.notas.map((nota, j) => (
                      <td key={j} className="centro">
                        <input
                          className="campo-nota"
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={nota}
                          aria-label={`${linha.aluno} – ${avaliacoes[j]}`}
                          onChange={(e) => mudarNota(i, j, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="centro">
                      <Etiqueta cor={corDaNota(m)}>{m === null ? '–' : m.toFixed(1)}</Etiqueta>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="cartao-rodape">
          <span className="dica">Média = (Prova 1 + Prova 2 + Trabalho) ÷ 3</span>
          <span className="mensagem" role="status">{mensagem}</span>
          <button className="botao" onClick={salvar}>Salvar notas</button>
        </div>
      </div>
    </>
  );
}