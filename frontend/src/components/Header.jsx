'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { perfis } from '@/src/lib/dados';
import { lerSessao, sair } from '@/src/lib/api';

export default function Header({ perfil }) {
  const [usuarioSessao, setUsuarioSessao] = useState(null);
  const caminho = usePathname();
  const router = useRouter();
  const hrefSophos = `/${perfil}/sophos-ai`;

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

  function aoSair() {
    sair();
    router.replace('/login');
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
          <Link
            href={hrefSophos}
            className={`botao-sophos ${caminho.startsWith(hrefSophos) ? 'ativo' : ''}`}
            aria-label="Abrir a SophosAI"
          >
            <IconeBrilho />
            <span>SophosAI</span>
          </Link>

          <button className="botao-icone" aria-label={`Notificações: ${usuario.avisos}`}>
            <Image src="/img/sino.svg" alt="" width={22} height={22} />
            <span className="contador">{usuario.avisos}</span>
          </button>

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
                <button type="button" className="sair" onClick={aoSair}>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

function IconeBrilho() {
  return (
    <svg className="icone-brilho" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2l1.9 5.6a3 3 0 0 0 1.9 1.9L21.4 11.4 15.8 13.3a3 3 0 0 0-1.9 1.9L12 20.8l-1.9-5.6a3 3 0 0 0-1.9-1.9L2.6 11.4l5.6-1.9a3 3 0 0 0 1.9-1.9L12 2z"
      />
    </svg>
  );
}
