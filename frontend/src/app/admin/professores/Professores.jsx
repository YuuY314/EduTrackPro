'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import { professores as professoresIniciais } from '@/src/lib/dados';

const situacoes = {
  'atrasado': { cor: 'ruim', texto: 'Atrasado' },
  'hoje': { cor: 'atencao', texto: 'Vence hoje' },
  'em-dia': { cor: 'bom', texto: 'Em dia' },
  'novo': { cor: 'vazio', texto: 'Novo' },
};

const vazio = { nome: '', disciplina: '', turmas: '', email: '' };

let proximoId = 1;
const novoId = () => `prof-${proximoId++}`;

export default function Professores() {
  const [professores, setProfessores] = useState(() =>
    professoresIniciais.map((p) => ({ id: novoId(), ...p }))
  );
  const [lembrados, setLembrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);

  const disciplinas = [...new Set(professores.map((p) => p.disciplina))].sort();

  const visiveis = professores.filter((p) => {
    const texto = `${p.nome} ${p.disciplina}`.toLowerCase();
    return texto.includes(busca.toLowerCase()) && (disciplina === '' || p.disciplina === disciplina);
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
    const dados = {
      nome: form.nome.trim(),
      disciplina: form.disciplina.trim(),
      turmas: form.turmas.trim() || '–',
      email: form.email.trim(),
    };

    if (editando) {
      setProfessores(professores.map((p) => (p.id === editando ? { ...p, ...dados } : p)));
    } else {
      setProfessores([{ id: novoId(), situacao: 'novo', ...dados }, ...professores]);
    }

    fecharFormulario();
  }

  function editar(professor) {
    setEditando(professor.id);
    setForm({
      nome: professor.nome,
      disciplina: professor.disciplina,
      turmas: professor.turmas === '–' ? '' : professor.turmas,
      email: professor.email ?? '',
    });
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function excluir(professor) {
    if (!window.confirm(`Excluir o professor ${professor.nome}?`)) return;
    setProfessores(professores.filter((p) => p.id !== professor.id));
    if (editando === professor.id) fecharFormulario();
  }

  return (
    <>
      <div className="filtros">
        <div className="campo largo">
          <label htmlFor="busca-professor">Buscar</label>
          <input
            id="busca-professor"
            type="search"
            placeholder="Nome ou disciplina"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="filtro-disciplina">Disciplina</label>
          <select id="filtro-disciplina" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
            <option value="">Todas</option>
            {disciplinas.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <button className="botao" onClick={abrirCadastro}>+ Cadastrar professor</button>
      </div>

      {formAberto && (
        <form className="cartao formulario" onSubmit={salvar}>
          <div className="campo">
            <label htmlFor="nome-professor">Nome completo</label>
            <input
              id="nome-professor"
              required
              autoFocus
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="disciplina-professor">Disciplina</label>
            <input
              id="disciplina-professor"
              required
              list="lista-disciplinas"
              placeholder="Ex.: Matemática"
              value={form.disciplina}
              onChange={(e) => setForm({ ...form, disciplina: e.target.value })}
            />
            <datalist id="lista-disciplinas">
              {disciplinas.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div className="campo">
            <label htmlFor="turmas-professor">Turmas</label>
            <input
              id="turmas-professor"
              placeholder="Ex.: 1º A, 2º B"
              value={form.turmas}
              onChange={(e) => setForm({ ...form, turmas: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="email-professor">E-mail</label>
            <input
              id="email-professor"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              <th>Professor</th>
              <th>Disciplina</th>
              <th>Turmas</th>
              <th className="centro">Notas do 3º bimestre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((p) => {
              const situacao = situacoes[p.situacao] ?? situacoes.novo;
              const lembrado = lembrados.includes(p.id);
              const precisaLembrete = p.situacao === 'atrasado' || p.situacao === 'hoje';
              return (
                <tr key={p.id}>
                  <td>
                    {p.nome}
                    {p.email && <small>{p.email}</small>}
                  </td>
                  <td>{p.disciplina}</td>
                  <td>{p.turmas}</td>
                  <td className="centro"><Etiqueta cor={situacao.cor}>{situacao.texto}</Etiqueta></td>
                  <td>
                    <div className="turma-botoes">
                      {precisaLembrete && (
                        <button
                          className="botao botao-pequeno botao-contorno"
                          disabled={lembrado}
                          onClick={() => setLembrados([...lembrados, p.id])}
                        >
                          {lembrado ? 'Lembrete enviado' : 'Enviar lembrete'}
                        </button>
                      )}
                      <button className="botao botao-pequeno botao-contorno" onClick={() => editar(p)}>
                        Editar
                      </button>
                      <button className="botao botao-pequeno botao-perigo" onClick={() => excluir(p)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={5} className="dica">
                  Nenhum professor encontrado. Confira a busca ou o filtro de disciplina.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}