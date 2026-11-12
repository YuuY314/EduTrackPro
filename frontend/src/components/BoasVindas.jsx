'use client';

import { useEffect, useState } from 'react';
import { perfis } from '@/src/lib/dados';
import { lerSessao } from '@/src/lib/api';

export default function BoasVindas({ perfil }) {
  const dadosMock = perfis[perfil] || perfis.aluno;
  const [usuarioSessao, setUsuarioSessao] = useState(null);

  useEffect (() => {
    const sessao = lerSessao();
    if (sessao?.usuario) {
      setUsuarioSessao(sessao.usuario);
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
