'use client';

import { useState } from 'react';
import { alunosDaTurma, turmas } from '@/lib/dados';

export default function Chamada() {
  const [faltas, setFaltas] = useState(['Eduarda Lima']);
  const [mensagem, setMensagem] = useState('');

  function alternar(aluno) {
    setMensagem('');
    if (faltas.includes(aluno)) {
      setFaltas(faltas.filter((nome) => nome !== aluno));
    } else {
      setFaltas([...faltas, aluno]);
    }
  }

  function salvar() {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setMensagem(`Chamada salva às ${hora}`);
  }

  const presentes = alunosDaTurma.length - faltas.length;

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
          <label htmlFor="data">Data</label>
          <input id="data" type="date" defaultValue="2026-10-26" />
        </div>
        <div className="campo">
          <label htmlFor="aula">Aula</label>
          <select id="aula">
            <option>1ª aula · 19:00</option>
            <option>2ª aula · 19:50</option>
          </select>
        </div>
      </div>

      <div className="cartao">
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Aluno</th>
                <th className="centro">Situação</th>
              </tr>
            </thead>
            <tbody>
              {alunosDaTurma.map((aluno, i) => {
                const faltou = faltas.includes(aluno);
                return (
                  <tr key={aluno}>
                    <td>{String(i + 1).padStart(2, '0')}</td>
                    <td>{aluno}</td>
                    <td className="centro">
                      <button
                        className={`botao-presenca ${faltou ? 'falta' : ''}`}
                        onClick={() => alternar(aluno)}
                      >
                        {faltou ? 'Falta' : 'Presente'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="cartao-rodape">
          <span>
            <strong>{presentes}</strong> presentes · <strong>{faltas.length}</strong>{' '}
            {faltas.length === 1 ? 'falta' : 'faltas'}
          </span>
          <span className="mensagem" role="status">{mensagem}</span>
          <button className="botao" onClick={salvar}>Salvar chamada</button>
        </div>
      </div>
    </>
  );
}
