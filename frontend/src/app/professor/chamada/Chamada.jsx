'use client';

import { useState } from 'react';
import Selecao from '@/src/components/Selecao';
import SeletorData from '@/src/components/SeletorData';
import { alunosDaTurma, turmas } from '@/src/lib/dados';

const aulas = [
  { value: '1', label: '1ª aula', detalhe: '19:00' },
  { value: '2', label: '2ª aula', detalhe: '19:50' },
];

export default function Chamada() {
  const [faltas, setFaltas] = useState(['Eduarda Lima']);
  const [mensagem, setMensagem] = useState('');
  const [turma, setTurma] = useState(turmas[0].id);
  const [aula, setAula] = useState(aulas[0].value);
  const [data, setData] = useState('2026-10-26');


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
          <Selecao
            id="turma"
            compacto
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
            opcoes={turmas.map((t) => ({ value: t.id, label: t.nome, detalhe: t.turno }))}
          />
        </div>
        <div className="campo">
          <label htmlFor="data">Data</label>
          <SeletorData id="data" compacto obrigatorio value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="aula">Aula</label>
          <Selecao id="aula" compacto value={aula} onChange={(e) => setAula(e.target.value)} opcoes={aulas} />
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