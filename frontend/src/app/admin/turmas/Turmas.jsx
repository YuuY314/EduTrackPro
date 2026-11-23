'use client';

import { useEffect, useState } from 'react';
import Etiqueta from '@/src/components/Etiqueta';
import NovaTurma from '@/src/components/NovaTurma';
import { admin } from '@/src/lib/api';

export default function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    admin.turmas().then(setTurmas).catch((e) => setErro(e.message)).finally(() => setCarregando(false));
  }, []);
  const [adicionando, setAdicionando] = useState(false);
  const [nova, setNova] = useState(null);

  async function adicionar(dados) {
    const turma = await admin.criarTurma(dados);
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
              <th>Ano letivo</th>
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
                <td>{t.ano_letivo}</td>
                <td className="centro">{t.alunos}</td>
                <td className="centro">
                  <Etiqueta cor={t.semProfessor ? 'atencao' : 'bom'}>{t.semProfessor}</Etiqueta>
                </td>
                <td><button className="botao botao-pequeno botao-contorno">Gerenciar</button></td>
              </tr>
            ))}
            {turmas.length === 0 && (
              <tr><td colSpan={6} className="dica">{carregando ? 'Carregando turmas…' : erro || 'Nenhuma turma cadastrada.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {adicionando && (
        <NovaTurma turmas={turmas} onSalvar={adicionar} onFechar={() => setAdicionando(false)} />
      )}
    </>
  );
}