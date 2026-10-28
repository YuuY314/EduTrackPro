'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { perfis } from '@/lib/dados';

export default function Header({ perfil }) {
  const usuario = perfis[perfil];
  const caminho = usePathname();

  const [menuAberto, setMenuAberto] = useState(false);
  const [usuarioAberto, setUsuarioAberto] = useState(false);
  const usuarioRef = useRef(null);

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

  function estaAtivo(href) {
    if (href === usuario.inicio) return caminho === href;
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

        <Link className="logo" href={usuario.inicio}>
          <Image src="/img/logo.svg" alt="" width={36} height={36} />
          Sophos Academy
        </Link>

        <nav className="nav">
          {usuario.menu.map((item) => (
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
              <span className="avatar">{usuario.iniciais}</span>
              <span>
                <strong>{usuario.nome}</strong>
                <small>{usuario.detalhe}</small>
              </span>
            </button>

            {usuarioAberto && (
              <div className="usuario-menu">
                <div className="usuario-menu-topo">
                  <strong>{usuario.nomeCompleto}</strong>
                  <small>{usuario.detalheCompleto}</small>
                </div>
                {usuario.opcoes.map((opcao) => (
                  <a key={opcao} href="#">{opcao}</a>
                ))}
                <Link href="/login" className="sair">Sair</Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
