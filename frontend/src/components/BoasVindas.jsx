'use client';

import { useEffect, useState } from 'react';
import { perfis } from '@/src/lib/dados';
import { api, lerSessao } from '@/src/lib/api';

export default function BoasVindas({ perfil }) {
  const dadosMock = perfis[perfil] || perfis.aluno;
  const [usuarioSessao, setUsuarioSessao] = useState(null);
  const [resumoProf, setResumoProf] = useState('');

  useEffect (() => {
    const sessao = lerSessao();
    if (sessao?.usuario) {
      setUsuarioSessao(sessao.usuario);

      if (sessao.usuario.perfil === 'professor' && sessao.usuario.id_professor) {
        api(`/turma_disciplina_professor/professor/${sessao.usuario.id_professor}`)
        .then((res) => {
          const lista = res?.dados || [];
          const unicas = [...new Set(lista.map((t) => t.disciplina).filter(Boolean))];
          const discTexto = unicas.length > 0 ? unicas.join(', ') : 'Sem disciplina';
            setResumoProf(`${discTexto} · EduTrackPro`);
        })
        .catch(() => {});
      }
    }
  }, []);

  const nomeCompleto = usuarioSessao?.nome || dadosMock.nomeCompleto || 'Aluno';
  const primeiroNome = nomeCompleto.split(' ')[0];

  const iniciais = nomeCompleto
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const perfilAtivo = usuarioSessao?.perfil || perfil;
  let detalheSubtitulo = dadosMock.saudacaoDetalhe;

  if (perfilAtivo === 'aluno') {
  const turma = usuarioSessao?.turma || 'Turma não atribuída';
  const turno = usuarioSessao?.turno || '';
  detalheSubtitulo = `${turma} ${turno} · EduTrackPro`.trim();
  } else if (perfilAtivo === 'professor' && resumoProf) {
    detalheSubtitulo = resumoProf;
  }
  return (
    <div className="boas-vindas">
      <span className="avatar">{iniciais}</span>
      <div>
        <h2>Olá, <strong>{primeiroNome}</strong></h2>
        <p>{detalheSubtitulo}</p>
      </div>
    </div>
  );
}