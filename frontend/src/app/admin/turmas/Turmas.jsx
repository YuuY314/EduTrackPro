'use client';

import { useEffect, useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import NovaTurma from '@/src/components/NovaTurma';
import {
  listarTurmasAdmin,
  criarTurmaAdmin,
  atualizarTurmaAdmin,
  excluirTurmaAdmin,
} from '@/src/lib/api';

export default function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nova, setNova] = useState(null);

  async function carregar(silencioso = false) {
    if (!silencioso) setCarregando(true);
    setErro('');
    try {
      const lista = await listarTurmasAdmin();
      setTurmas(lista);
    } catch (e) {
      setErro(e.message || 'Erro ao carregar turmas.');
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar(dados) {
    const criada = await criarTurmaAdmin(dados);
    const idCriada = Number(criada?.id_turma ?? criada?.id ?? criada?.dados?.id_turma ?? criada?.dados?.id);
    await carregar(true);
    if (idCriada) setNova(idCriada);
  }

  async function atualizar(dados) {
    await atualizarTurmaAdmin(editando.id_turma ?? editando.id, dados);
    await carregar(true);
  }

  async function excluir(turma) {
    if (!window.confirm(`Excluir a turma ${turma.nome}?`)) return;
    try {
      setErro('');
      await excluirTurmaAdmin(turma.id_turma ?? turma.id);
      setTurmas((lista) => lista.filter((t) => t.id !== turma.id));
    } catch (e) {
      setErro(e.message || 'Não foi possível excluir a turma (verifique se há alunos ou aulas vinculadas).');
    }
  }

  return (
    <>
      <div className="filtros">
        <button className="botao" onClick={() => setAdicionando(true)}>+ Nova turma</button>
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
              <th>Turma</th>
              <th>Turno</th>
              <th>Ano letivo</th>
              <th className="centro">Alunos</th>
              <th className="centro">Disciplinas sem professor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="dica">
                  Carregando turmas...
                </td>
              </tr>
            ) : (
              <>
                {turmas.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.nome}
                      {t.id === nova && <small>Adicionada agora</small>}
                    </td>
                    <td>{t.turno}</td>
                    <td>{t.ano_letivo}</td>
                    <td className="centro">{t.alunos}</td>
                    <td className="centro">
                      <Etiqueta cor={t.semProfessor ? 'atencao' : 'bom'}>{t.semProfessor}</Etiqueta>
                    </td>
                    <td>
                      <div className="turma-botoes">
                        <button
                          className="botao botao-pequeno botao-contorno"
                          onClick={() => setEditando(t)}
                        >
                          Gerenciar
                        </button>
                        <button
                          className="botao botao-pequeno botao-perigo"
                          onClick={() => excluir(t)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {turmas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="dica">
                      Nenhuma turma cadastrada. Clique em "+ Nova turma" para começar.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {adicionando && (
        <NovaTurma turmas={turmas} onSalvar={adicionar} onFechar={() => setAdicionando(false)} />
      )}

      {editando && (
        <NovaTurma
          key={editando.id}
          turmas={turmas}
          turmaInicial={editando}
          onSalvar={atualizar}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}