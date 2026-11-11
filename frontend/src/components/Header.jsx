'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { perfis } from '@/src/lib/dados';
import { lerSessao, sair } from '@/src/lib/api';

export default function Header({ perfil }) {
  const [usuarioSessao, setUsuarioSessao] = useState(null);
  const caminho = usePathname();

  const [menuAberto, setMenuAberto] = useState(false);
  const [usuarioAberto, setUsuarioAberto] = useState(false);
  const usuarioRef = useRef(null);

  useEffect(() => {
    const sessao = lerSessao();
    if (sessao?.usuario) {
      setUsuarioSessao(sessao.usuario);
    }
  }, []);

  useEffect(() => {
    setMenuAberto(false);
    setUsuarioAberto(false);
  }, [caminho]);

  useEffect(() => {
    function clicouFora(evento) {
      if (usuarioRef.current && !usuarioRef.current.contains(evento.target)) {
        setUsuarioAberto(false);
      }
    }
    document.addEventListener('click', clicouFora);
    return () => document.removeEventListener('click', clicouFora);
  }, []);

  const perfilAtivo = usuarioSessao?.perfil || perfil || 'aluno';
  const dadosMock = perfis[perfilAtivo] || perfis.aluno;

  const nomeCompleto = usuarioSessao?.nome || dadosMock.nomeCompleto || 'Usuário';
  const primeiroNome = nomeCompleto.split(' ')[0];

  const iniciais = nomeCompleto
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  let detalhe = dadosMock.detalhe;

  if (perfilAtivo === 'aluno') {
    if (usuarioSessao?.turma) {
      const turno = usuarioSessao.turno ? ` · ${usuarioSessao.turno}` : '';
      detalhe = `${usuarioSessao.turma}${turno}`;
    } else {
      detalhe = 'Sem turma';
    }
  }

  function estaAtivo(href) {
    if (href === dadosMock.inicio) return caminho === href;
    return caminho.startsWith(href);
  }

  return (
    <header className={`header ${menuAberto ? 'menu-aberto' : ''}`}>
      <div className="container header-bar">

        <button
          className="botao-icone botao-menu"
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <Image src="/img/menu.svg" alt="" width={22} height={22} />
        </button>

        <Link className="logo" href={dadosMock.inicio}>
          <Image src="/img/logo.svg" alt="" width={36} height={36} />
          EduTrackPro
        </Link>

        <nav className="nav">
          {dadosMock.menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={estaAtivo(item.href) ? 'ativo' : ''}
            >
              {item.nome}
            </Link>
          ))}
        </nav>

        <div className="header-direita">

          <div className="usuario" ref={usuarioRef}>
            <button
              className="usuario-botao"
              aria-expanded={usuarioAberto}
              onClick={() => setUsuarioAberto(!usuarioAberto)}
            >
              <span className="avatar">{iniciais}</span>
              <span>
                <strong>{primeiroNome}</strong>
                <small>{detalhe}</small>
              </span>
            </button>

            {usuarioAberto && (
              <div className="usuario-menu">
                <div className="usuario-menu-topo">
                  <strong>{nomeCompleto}</strong>
                  <small>{detalhe}</small>
                </div>
               
                <Link href="/login" className="sair" onClick={sair}>Sair</Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}