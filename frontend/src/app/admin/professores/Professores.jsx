'use client';

import { useEffect, useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import EditarProfessor from '@/src/components/EditarProfessor';
import Selecao from '@/src/components/Selecao';
import {
  listarProfessoresAdmin,
  atualizarProfessorAdmin,
  excluirProfessorAdmin,
} from '@/src/lib/api';

const situacoes = {
  'atrasado': { cor: 'ruim', texto: 'Atrasado' },
  'hoje': { cor: 'atencao', texto: 'Vence hoje' },
  'em-dia': { cor: 'bom', texto: 'Em dia' },
  'novo': { cor: 'vazio', texto: 'Novo' },
};

export default function Professores() {
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [disciplinasLista, setDisciplinasLista] = useState([]);
  const [bimestre, setBimestre] = useState(3);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [lembrados, setLembrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [editando, setEditando] = useState(null);

  async function carregar(silencioso = false) {
    if (!silencioso) setCarregando(true);
    setErro('');
    try {
      const dados = await listarProfessoresAdmin();
      setProfessores(dados.professores);
      setTurmas(dados.turmas);
      setDisciplinasLista(dados.disciplinas);
      setBimestre(dados.bimestreAtual);
    } catch (e) {
      setErro(e.message || 'Erro ao carregar professores.');
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const disciplinas = [
    ...new Set([
      ...disciplinasLista.map((d) => d.nome),
      ...professores
        .flatMap((p) => (p.disciplina || '').split(',').map((s) => s.trim()))
        .filter((d) => d && d !== 'Sem disciplina'),
    ]),
  ].sort();

  const visiveis = professores.filter((p) => {
    const texto = `${p.nome} ${p.disciplina}`.toLowerCase();
    return texto.includes(busca.toLowerCase()) && (disciplina === '' || p.disciplina.includes(disciplina));
  });

  async function salvar(dados) {
    try {
      setErro('');
      await atualizarProfessorAdmin(editando, dados, {
        turmasDisponiveis: turmas,
        disciplinasDisponiveis: disciplinasLista,
      });
      await carregar(true);
      setEditando(null);
    } catch (e) {
      setErro(e.message || 'Não foi possível salvar as alterações do professor.');
    }
  }

  async function excluir(professor) {
    if (!window.confirm(`Excluir o professor ${professor.nome}?`)) return;
    try {
      setErro('');
      await excluirProfessorAdmin(professor.id_professor ?? professor.id);
      setProfessores((lista) => lista.filter((p) => p.id !== professor.id));
    } catch (e) {
      setErro(e.message || 'Não foi possível excluir o professor (verifique se ele possui turmas vinculadas).');
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

      {erro && (
        <p className="dica" style={{ color: '#f87171', marginBottom: '1rem' }}>
          {erro}
        </p>
      )}

      <div className="cartao tabela-rolagem tabela-larga tabela-escura">
        <table>
          <thead>
            <tr>
              <th>Professor</th>
              <th>Disciplina</th>
              <th>Turmas</th>
              <th className="centro">Notas do {bimestre}º bimestre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={5} className="dica">
                  Carregando professores...
                </td>
              </tr>
            ) : (
              <>
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
                      <td>
                        {p.turmasDetalhes?.length > 0 ? (
                          p.turmasDetalhes.map((t) => (
                            <div key={t.nome}>
                              {t.nome}
                              {t.turno && <small>{t.turno}</small>}
                            </div>
                          ))
                        ) : (
                          p.turmas
                        )}
                      </td>
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
              </>
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