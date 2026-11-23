'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import NovaTurma from '@/src/components/NovaTurma';
import { turmas as turmasIniciais } from '@/src/lib/dados';

export default function Turmas() {
  const [turmas, setTurmas] = useState(turmasIniciais);
  const [adicionando, setAdicionando] = useState(false);
  const [nova, setNova] = useState(null);

  function adicionar(turma) {
    setTurmas([...turmas, turma]);
    setNova(turma.id);
  }

  return (
    <>
      <div className="filtros">
        <button className="botao" onClick={() => setAdicionando(true)}>+ Nova turma</button>
      </div>

      <div className="cartao tabela-rolagem tabela-larga tabela-escura">
        <table>
          <thead>
            <tr>
              <th>Turma</th>
              <th>Turno</th>
              <th>Sala</th>
              <th className="centro">Alunos</th>
              <th className="centro">Disciplinas sem professor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.nome}
                  {t.id === nova && <small>Adicionada agora</small>}
                </td>
                <td>{t.turno}</td>
                <td>{t.sala}</td>
                <td className="centro">{t.alunos}</td>
                <td className="centro">
                  <Etiqueta cor={t.semProfessor ? 'atencao' : 'bom'}>{t.semProfessor}</Etiqueta>
                </td>
                <td><button className="botao botao-pequeno botao-contorno">Gerenciar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adicionando && (
        <NovaTurma turmas={turmas} onSalvar={adicionar} onFechar={() => setAdicionando(false)} />
      )}
    </>
  );
}