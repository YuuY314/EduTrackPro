'use client';

import { useState } from 'react';
import Etiqueta from '@/components/Etiqueta';
import { alunosDaEscola, turmas } from '@/lib/dados';

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
  const [formAberto, setFormAberto] = useState(false);
  const [novo, setNovo] = useState({ nome: '', turma: turmas[0].id, responsavel: '' });

  const visiveis = alunos.filter((a) => {
    const texto = `${a.nome} ${a.matricula}`.toLowerCase();
    return texto.includes(busca.toLowerCase()) && (turno === '' || a.turno === turno);
  });

  function cadastrar(evento) {
    evento.preventDefault();
    const turma = turmas.find((t) => t.id === novo.turma);
    const aluno = {
      matricula: `26.${String(500 + alunos.length).padStart(4, '0')}`,
      nome: novo.nome,
      turma: turma.nome,
      turno: turma.turno,
      presenca: null,
    };
    setAlunos([aluno, ...alunos]);
    setNovo({ nome: '', turma: turmas[0].id, responsavel: '' });
    setFormAberto(false);
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
          <select id="turno" value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="">Todos</option>
            <option>Manhã</option>
            <option>Tarde</option>
            <option>Noite</option>
          </select>
        </div>
        <button className="botao" onClick={() => setFormAberto(true)}>+ Cadastrar aluno</button>
      </div>

      {formAberto && (
        <form className="cartao formulario" onSubmit={cadastrar}>
          <div className="campo">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              required
              autoFocus
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="turma-aluno">Turma</label>
            <select
              id="turma-aluno"
              value={novo.turma}
              onChange={(e) => setNovo({ ...novo, turma: e.target.value })}
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome} · {t.turno}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="responsavel">Responsável</label>
            <input
              id="responsavel"
              value={novo.responsavel}
              onChange={(e) => setNovo({ ...novo, responsavel: e.target.value })}
            />
          </div>
          <div className="turma-botoes">
            <button className="botao" type="submit">Salvar</button>
            <button className="botao botao-contorno" type="button" onClick={() => setFormAberto(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

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
                <td>{a.nome}</td>
                <td>{a.turma}<small>{a.turno}</small></td>
                <td className="centro">{a.presenca === null ? '–' : `${a.presenca}%`}</td>
                <td className="centro"><Situacao presenca={a.presenca} /></td>
                <td><button className="botao botao-pequeno botao-contorno">Editar</button></td>
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
    </>
  );
}
