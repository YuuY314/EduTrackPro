'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Selecao.module.css';

const VARIAVEIS = ['--border', '--field', '--card', '--text', '--muted', '--blue', '--focus', '--navy', '--danger'];

export default function Selecao({
  value,
  onChange,
  opcoes,
  placeholder = 'Selecione',
  erro = false,
  autoFocus = false,
  multiplo = false,
  compacto = false,
  id: idExterno,
}) {
  const [aberta, setAberta] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [posicao, setPosicao] = useState(null);
  const caixa = useRef(null);
  const lista = useRef(null);
  const id = useId();

  const marcados = multiplo ? (value ?? []).map(String) : [String(value)];
  const estaMarcada = (o) => marcados.includes(String(o.value));
  const selecionadas = opcoes.filter(estaMarcada);
  const selecionada = multiplo ? null : selecionadas[0];

  function calcularPosicao() {
    const el = caixa.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rodape = el.closest('form')?.querySelector('footer')?.getBoundingClientRect();
    const limite = rodape && rodape.top > r.bottom ? rodape.top : window.innerHeight;
    const altura = Math.min(264, opcoes.length * 46 + 14);
    const paraCima = limite - r.bottom < altura + 12 && r.top > limite - r.bottom;

    const estilo = getComputedStyle(el);
    const variaveis = {};
    VARIAVEIS.forEach((v) => {
      const valor = estilo.getPropertyValue(v).trim();
      if (valor) variaveis[v] = valor;
    });

    setPosicao({
      paraCima,
      estilo: {
        ...variaveis,
        position: 'fixed',
        left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 220) - 8)),
        width: Math.max(r.width, 220),
        fontFamily: estilo.fontFamily,
        ...(paraCima ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
      },
    });
  }

  useLayoutEffect(() => {
    if (!aberta) return;
    calcularPosicao();
    function atualizar(e) {
      if (e.target instanceof Node && lista.current?.contains(e.target)) return;
      calcularPosicao();
    }
    window.addEventListener('scroll', atualizar, true);
    window.addEventListener('resize', atualizar);
    return () => {
      window.removeEventListener('scroll', atualizar, true);
      window.removeEventListener('resize', atualizar);
    };
  }, [aberta]);

  useEffect(() => {
    if (!aberta) return;
    function fora(e) {
      if (e.target instanceof Node && !caixa.current?.contains(e.target) && !lista.current?.contains(e.target)) setAberta(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberta]);

  useEffect(() => {
    const ul = lista.current;
    const item = ul?.children[ativo];
    if (!aberta || !item) return;
    if (item.offsetTop < ul.scrollTop) ul.scrollTop = item.offsetTop - 6;
    else if (item.offsetTop + item.offsetHeight > ul.scrollTop + ul.clientHeight) {
      ul.scrollTop = item.offsetTop + item.offsetHeight - ul.clientHeight + 6;
    }
  }, [aberta, ativo, posicao]);

  function abrir() {
    setAtivo(Math.max(0, opcoes.findIndex(estaMarcada)));
    setAberta(true);
  }

  function escolher(opcao) {
    if (!multiplo) {
      onChange({ target: { value: opcao.value } });
      setAberta(false);
      return;
    }
    const novos = estaMarcada(opcao)
      ? opcoes.filter((o) => estaMarcada(o) && o.value !== opcao.value)
      : opcoes.filter((o) => estaMarcada(o) || o.value === opcao.value);
    onChange({ target: { value: novos.map((o) => o.value) } });
  }

  function tecla(e) {
    if (e.key === 'Tab') {
      setAberta(false);
      return;
    }
    if (!aberta && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      abrir();
      return;
    }
    if (!aberta) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setAberta(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAtivo((i) => Math.min(opcoes.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (opcoes[ativo]) escolher(opcoes[ativo]);
    }
  }

  return (
    <div ref={caixa} className={styles.caixa}>
      <button
        type="button"
        id={idExterno}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberta}
        aria-controls={`${id}-lista`}
        aria-activedescendant={aberta && ativo >= 0 ? `${id}-${ativo}` : undefined}
        aria-invalid={erro || undefined}
        autoFocus={autoFocus}
        className={`${styles.gatilho} ${compacto ? styles.compacto : ''} ${aberta ? styles.gatilhoAberto : ''}`}
        onClick={() => (aberta ? setAberta(false) : abrir())}
        onKeyDown={tecla}
      >
        {multiplo ? (
          selecionadas.length ? (
            <span className={styles.multiplos}>
              {selecionadas.slice(0, 2).map((o) => (
                <span key={o.value} className={styles.pilula}>{o.label}</span>
              ))}
              {selecionadas.length > 2 && <span className={styles.selo}>+{selecionadas.length - 2}</span>}
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )
        ) : (
          <>
            <span className={selecionada ? styles.valor : styles.placeholder}>
              {selecionada ? selecionada.label : placeholder}
            </span>
            {selecionada?.detalhe && <span className={styles.selo}>{selecionada.detalhe}</span>}
          </>
        )}
        <svg className={styles.seta} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberta && posicao && createPortal(
        <ul
          ref={lista}
          id={`${id}-lista`}
          role="listbox"
          aria-multiselectable={multiplo || undefined}
          className={`${styles.lista} ${multiplo ? styles.listaMultipla : ''} ${posicao.paraCima ? styles.paraCima : ''}`}
          style={posicao.estilo}
        >
          {opcoes.map((o, i) => {
            const marcada = estaMarcada(o);
            return (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={marcada}
                className={`${styles.opcao} ${i === ativo ? styles.ativa : ''} ${marcada ? styles.marcada : ''}`}
                style={{ animationDelay: `${i * 25}ms` }}
                onMouseEnter={() => setAtivo(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(o)}
              >
                <span className={styles.check} aria-hidden="true" />
                <span className={styles.texto}>{o.label}</span>
                {o.detalhe && <span className={styles.selo}>{o.detalhe}</span>}
              </li>
            );
          })}
          {opcoes.length === 0 && <li className={styles.vazio}>Nenhuma opção disponível</li>}
        </ul>,
        document.body
      )}
    </div>
  );
}