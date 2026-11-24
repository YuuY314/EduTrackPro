'use client';

import { useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import EditarProfessor from '@/src/components/EditarProfessor';
import Selecao from '@/src/components/Selecao';
import { professores as professoresIniciais, turmas } from '@/src/lib/dados';

const situacoes = {
  'atrasado': { cor: 'ruim', texto: 'Atrasado' },
  'hoje': { cor: 'atencao', texto: 'Vence hoje' },
  'em-dia': { cor: 'bom', texto: 'Em dia' },
  'novo': { cor: 'vazio', texto: 'Novo' },
};

let proximoId = 1;
const novoId = () => `prof-${proximoId++}`;

export default function Professores() {
  const [professores, setProfessores] = useState(() =>
    professoresIniciais.map((p) => ({ id: novoId(), ...p }))
  );
  const [lembrados, setLembrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [editando, setEditando] = useState(null);

  const separar = (texto) => (texto ?? '').split(',').map((d) => d.trim()).filter(Boolean);
  const disciplinas = [...new Set(professores.flatMap((p) => separar(p.disciplina)))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  const visiveis = professores.filter((p) => {
    const texto = `${p.nome} ${p.disciplina}`.toLowerCase();
    return texto.includes(busca.toLowerCase()) && (disciplina === '' || separar(p.disciplina).includes(disciplina));
  });

  function salvar(dados) {
    setProfessores(professores.map((p) => (p.id === editando.id ? { ...p, ...dados } : p)));
  }

  function excluir(professor) {
    if (!window.confirm(`Excluir o professor ${professor.nome}?`)) return;
    setProfessores(professores.filter((p) => p.id !== professor.id));
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
          <Selecao
            id="filtro-disciplina"
            compacto
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            opcoes={[{ value: '', label: 'Todas' }, ...disciplinas.map((d) => ({ value: d, label: d }))]}
          />
        </div>
      </div>

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
                      <button className="botao botao-pequeno botao-contorno" onClick={() => setEditando(p)}>
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

      {editando && (
        <EditarProfessor
          key={editando.id}
          professor={editando}
          disciplinas={disciplinas}
          turmas={turmas}
          onSalvar={salvar}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}