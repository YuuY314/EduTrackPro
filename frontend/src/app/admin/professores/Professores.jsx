'use client';

import { useEffect, useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import EditarProfessor from '@/src/components/EditarProfessor';
import Selecao from '@/src/components/Selecao';
import { admin } from '@/src/lib/api';

const situacoes = {
  'atrasado': { cor: 'ruim', texto: 'Atrasado' },
  'hoje': { cor: 'atencao', texto: 'Vence hoje' },
  'em-dia': { cor: 'bom', texto: 'Em dia' },
  'novo': { cor: 'vazio', texto: 'Novo' },
};


export default function Professores() {
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [lembrados, setLembrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    Promise.all([admin.professores(), admin.turmas()])
      .then(([p, t]) => { setProfessores(p); setTurmas(t); })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  const disciplinas = [...new Set(professores.flatMap((p) => (p.disciplina ? p.disciplina.split(', ') : [])))].sort();
  const nomesTurmas = (p) => turmas.filter((t) => p.ids_turmas.includes(t.id)).map((t) => t.nomeCurto).join(', ') || '–';

  const visiveis = professores.filter((p) => {
    const texto = `${p.nome} ${p.disciplina ?? ''}`.toLowerCase();
    return texto.includes(busca.toLowerCase()) && (disciplina === '' || (p.disciplina ?? '').split(', ').includes(disciplina));
  });

  async function salvar(dados) {
    const atualizado = await admin.salvarProfessor(editando.id_professor, dados);
    setProfessores(professores.map((p) => (p.id_professor === atualizado.id_professor ? atualizado : p)));
  }

  async function excluir(professor) {
    if (!window.confirm(`Excluir o professor ${professor.nome}?`)) return;
    try {
      await admin.excluirProfessor(professor.id_professor);
      setProfessores(professores.filter((p) => p.id_professor !== professor.id_professor));
    } catch (e) {
      window.alert(e.message);
    }
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
              const lembrado = lembrados.includes(p.id_professor);
              const precisaLembrete = p.situacao === 'atrasado' || p.situacao === 'hoje';
              return (
                <tr key={p.id_professor}>
                  <td>
                    {p.nome}
                    {p.email && <small>{p.email}</small>}
                  </td>
                  <td>{p.disciplina || '–'}</td>
                  <td>{nomesTurmas(p)}</td>
                  <td className="centro"><Etiqueta cor={situacao.cor}>{situacao.texto}</Etiqueta></td>
                  <td>
                    <div className="turma-botoes">
                      {precisaLembrete && (
                        <button
                          className="botao botao-pequeno botao-contorno"
                          disabled={lembrado}
                          onClick={() => setLembrados([...lembrados, p.id_professor])}
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
                  {carregando ? 'Carregando professores…' : erro || 'Nenhum professor encontrado. Confira a busca ou o filtro de disciplina.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <EditarProfessor
          key={editando.id_professor}
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