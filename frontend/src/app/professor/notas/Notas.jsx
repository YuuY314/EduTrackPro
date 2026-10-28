'use client';

import { useState } from 'react';
import Etiqueta from '@/components/Etiqueta';
import { notasDaTurma, turmas } from '@/lib/dados';
import { corDaNota, media } from '@/lib/utils';

const avaliacoes = ['Prova 1', 'Prova 2', 'Trabalho'];

export default function Notas() {
  const [linhas, setLinhas] = useState(
    notasDaTurma.map((l) => ({ ...l, notas: l.notas.map((n) => n ?? '') }))
  );
  const [mensagem, setMensagem] = useState('');

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
          <select id="turma">
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome} · {t.turno}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="bimestre">Bimestre</label>
          <select id="bimestre">
            <option>3º Bimestre</option>
            <option>4º Bimestre</option>
          </select>
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
