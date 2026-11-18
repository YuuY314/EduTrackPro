'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import EditarAluno from '@/src/components/EditarAluno';
import Selecao from '@/src/components/Selecao';
import { alunosDaEscola, turmas } from '@/src/lib/dados';

function Situacao({ presenca }) {
  if (presenca === null) return <Etiqueta cor="vazio">Novo</Etiqueta>;
  if (presenca < 75) return <Etiqueta cor="ruim">Risco</Etiqueta>;
  if (presenca < 80) return <Etiqueta cor="atencao">Atenção</Etiqueta>;
  return <Etiqueta cor="bom">Regular</Etiqueta>;
}

export default function Alunos() {
  const [alunos, setAlunos] = useState(alunosDaEscola);
  const [busca, setBusca] = useState('');
  const [turno, setTurno] = useState('');
  const [editando, setEditando] = useState(null);

  const visiveis = alunos.filter((a) => {
    const texto = `${a.nome} ${a.matricula}`.toLowerCase();
    return texto.includes(busca.toLowerCase()) && (turno === '' || a.turno === turno);
  });

  function salvar(dados) {
    setAlunos(alunos.map((a) => (a.matricula === editando.matricula ? { ...a, ...dados } : a)));
  }

  function excluir(aluno) {
    if (!window.confirm(`Excluir o aluno ${aluno.nome} (${aluno.matricula})?`)) return;
    setAlunos(alunos.filter((a) => a.matricula !== aluno.matricula));
  }

  return (
    <>
      <div className="filtros">
        <div className="campo largo">
          <label htmlFor="busca">Buscar</label>
          <input
            id="busca"
            type="search"
            placeholder="Nome ou matrícula"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="turno">Turno</label>
          <Selecao
            id="turno"
            compacto
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            opcoes={['', 'Manhã', 'Tarde', 'Noite'].map((t) => ({ value: t, label: t || 'Todos' }))}
          />
        </div>
      </div>

      <div className="cartao tabela-rolagem tabela-larga tabela-escura">
        <table>
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Aluno</th>
              <th>Turma</th>
              <th className="centro">Frequência</th>
              <th className="centro">Situação</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((a) => (
              <tr key={a.matricula}>
                <td>{a.matricula}</td>
                <td>
                  {a.nome}
                  {a.responsavel && <small>Resp.: {a.responsavel}</small>}
                </td>
                <td>{a.turma}<small>{a.turno}</small></td>
                <td className="centro">{a.presenca === null ? '–' : `${a.presenca}%`}</td>
                <td className="centro"><Situacao presenca={a.presenca} /></td>
                <td>
                  <div className="turma-botoes">
                    <button className="botao botao-pequeno botao-contorno" onClick={() => setEditando(a)}>
                      Editar
                    </button>
                    <button className="botao botao-pequeno botao-perigo" onClick={() => excluir(a)}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={6} className="dica">
                  Nenhum aluno encontrado. Confira a busca ou o filtro de turno.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <EditarAluno
          key={editando.matricula}
          aluno={editando}
          turmas={turmas}
          onSalvar={salvar}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}