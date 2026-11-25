'use client';

import { useEffect, useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import EditarProfessor from '@/src/components/EditarProfessor';
import Selecao from '@/src/components/Selecao';
import { chaveOcupacao } from '@/src/components/SecaoVinculos';
import {
  listarProfessoresAdmin,
  atualizarProfessorAdmin,
  excluirProfessorAdmin,
  transferirVinculoProfessor,
  enviarLembreteProfessor,
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
  const [enviando, setEnviando] = useState(null);
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
    // compara a disciplina inteira ("Física" não pode casar com "Educação Física")
    const doProfessor = (p.disciplina || '').split(',').map((d) => d.trim());
    return texto.includes(busca.toLowerCase()) && (disciplina === '' || doProfessor.includes(disciplina));
  });

  // Quem já dá cada disciplina em cada turma, e a grade já ocupada de cada
  // turma. O modal usa isso para bloquear, ANTES de salvar, o que daria erro.
  const ocupacao = new Map();
  const ocupados = [];
  professores.forEach((p) => {
    (p.vinculos ?? []).forEach((v) =>
      ocupacao.set(chaveOcupacao(v.id_turma, v.disciplina), { id_professor: p.id, professor: p.nome })
    );
    (p.horarios ?? []).forEach((h) => ocupados.push({ ...h, id_professor: p.id, professor: p.nome }));
  });

  // Sem try/catch aqui de propósito: o erro volta para o modal, que fica aberto
  // mostrando o motivo. Antes o erro era engolido, o modal fechava e parecia
  // que "as alterações não foram salvas" sem explicação.
  async function salvar(dados) {
    setErro('');
    await atualizarProfessorAdmin(editando, dados);
    await carregar(true);
  }

  async function transferir(idTdp, idDestino) {
    await transferirVinculoProfessor(editando.id_professor, idTdp, idDestino);
    await carregar(true);
  }

  async function excluir(professor) {
    if (!window.confirm(`Excluir o professor ${professor.nome}?`)) return;
    try {
      setErro('');
      await excluirProfessorAdmin(professor.id_professor ?? professor.id);
      setProfessores((lista) => lista.filter((p) => p.id !== professor.id));
    } catch (e) {
      setErro(e.message || 'Não foi possível excluir o professor.');
    }
  }

  async function enviarLembrete(professor) {
    try {
      setErro('');
      setEnviando(professor.id);
      await enviarLembreteProfessor(professor.id);
      setLembrados((lista) => [...lista, professor.id]);
    } catch (e) {
      setErro(e.message || 'Não foi possível enviar o lembrete.');
    } finally {
      setEnviando(null);
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
                              disabled={lembrado || enviando === p.id}
                              onClick={() => enviarLembrete(p)}
                            >
                              {enviando === p.id ? 'Enviando...' : lembrado ? 'Lembrete enviado' : 'Enviar lembrete'}
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
          key={editando.id_professor}
          professor={editando}
          disciplinas={disciplinas}
          turmas={turmas}
          ocupacao={ocupacao}
          ocupados={ocupados}
          professores={professores}
          onSalvar={salvar}
          onTransferir={transferir}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}