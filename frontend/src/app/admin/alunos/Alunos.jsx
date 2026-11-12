'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import { alunosDaEscola, turmas } from '@/src/lib/dados';

const vazio = { nome: '', turma: turmas[0].id, responsavel: '' };

function Situacao({ presenca }) {
  if (presenca === null) return <Etiqueta cor="vazio">Novo</Etiqueta>;
  if (presenca < 75) return <Etiqueta cor="ruim">Risco</Etiqueta>;
  if (presenca < 80) return <Etiqueta cor="atencao">Atenção</Etiqueta>;
  return <Etiqueta cor="bom">Regular</Etiqueta>;
}

function proximaMatricula(alunos) {
  const numeros = alunos.map((a) => Number(a.matricula.split('.')[1]) || 0);
  const maior = Math.max(499, ...numeros);
  return `26.${String(maior + 1).padStart(4, '0')}`;
}

export default function Alunos() {
  const [alunos, setAlunos] = useState(alunosDaEscola);
  const [busca, setBusca] = useState('');
  const [turno, setTurno] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null); // matrícula do aluno em edição

  const visiveis = alunos.filter((a) => {
    const texto = `${a.nome} ${a.matricula}`.toLowerCase();
    return texto.includes(busca.toLowerCase()) && (turno === '' || a.turno === turno);
  });

  function abrirCadastro() {
    setEditando(null);
    setForm(vazio);
    setFormAberto(true);
  }

  function fecharFormulario() {
    setEditando(null);
    setForm(vazio);
    setFormAberto(false);
  }

  function salvar(evento) {
    evento.preventDefault();
    const turma = turmas.find((t) => t.id === form.turma);
    const dados = {
      nome: form.nome.trim(),
      turma: turma.nome,
      turno: turma.turno,
      responsavel: form.responsavel.trim(),
    };

    if (editando) {
      setAlunos(alunos.map((a) => (a.matricula === editando ? { ...a, ...dados } : a)));
    } else {
      setAlunos([{ matricula: proximaMatricula(alunos), presenca: null, ...dados }, ...alunos]);
    }

    fecharFormulario();
  }

  function editar(aluno) {
    const turma = turmas.find((t) => t.nome === aluno.turma && t.turno === aluno.turno);
    setEditando(aluno.matricula);
    setForm({
      nome: aluno.nome,
      turma: turma?.id ?? turmas[0].id,
      responsavel: aluno.responsavel ?? '',
    });
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function excluir(aluno) {
    if (!window.confirm(`Excluir o aluno ${aluno.nome} (${aluno.matricula})?`)) return;
    setAlunos(alunos.filter((a) => a.matricula !== aluno.matricula));
    if (editando === aluno.matricula) fecharFormulario();
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
        <button className="botao" onClick={abrirCadastro}>+ Cadastrar aluno</button>
      </div>

      {formAberto && (
        <form className="cartao formulario" onSubmit={salvar}>
          <div className="campo">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              required
              autoFocus
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="turma-aluno">Turma</label>
            <select
              id="turma-aluno"
              value={form.turma}
              onChange={(e) => setForm({ ...form, turma: e.target.value })}
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
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            />
          </div>
          <div className="turma-botoes">
            <button className="botao" type="submit">
              {editando ? 'Salvar alterações' : 'Salvar'}
            </button>
            <button className="botao botao-contorno" type="button" onClick={fecharFormulario}>
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
                <td>
                  {a.nome}
                  {a.responsavel && <small>Resp.: {a.responsavel}</small>}
                </td>
                <td>{a.turma}<small>{a.turno}</small></td>
                <td className="centro">{a.presenca === null ? '–' : `${a.presenca}%`}</td>
                <td className="centro"><Situacao presenca={a.presenca} /></td>
                <td>
                  <div className="turma-botoes">
                    <button className="botao botao-pequeno botao-contorno" onClick={() => editar(a)}>
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
    </>
  );
}