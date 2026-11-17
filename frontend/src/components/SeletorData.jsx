'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import base from './Selecao.module.css';
import styles from './SeletorData.module.css';

const VARIAVEIS = ['--border', '--field', '--card', '--text', '--muted', '--blue', '--focus', '--navy', '--danger'];
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const LARGURA = 300;

const doisDigitos = (n) => String(n).padStart(2, '0');
const paraISO = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

function lerISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return null;
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function somarDias(data, dias) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function somarMeses(data, meses) {
  const nova = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimo = new Date(nova.getFullYear(), nova.getMonth() + 1, 0).getDate();
  nova.setDate(Math.min(data.getDate(), ultimo));
  return nova;
}

function diasDoMes(referencia) {
  const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const inicio = somarDias(primeiro, -primeiro.getDay());
  return Array.from({ length: 42 }, (_, i) => somarDias(inicio, i));
}

export default function SeletorData({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  obrigatorio = false,
  compacto = false,
  erro = false,
  id: idExterno,
}) {
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(() => lerISO(value) ?? new Date());
  const [posicao, setPosicao] = useState(null);
  const caixa = useRef(null);
  const painel = useRef(null);
  const gatilho = useRef(null);
  const id = useId();

  const selecionada = lerISO(value);
  const hoje = paraISO(new Date());
  const texto = selecionada
    ? `${doisDigitos(selecionada.getDate())}/${doisDigitos(selecionada.getMonth() + 1)}/${selecionada.getFullYear()}`
    : '';
  const nomeMes = foco.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const tituloMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

  function calcularPosicao() {
    const el = caixa.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const altura = 360;
    const paraCima = window.innerHeight - r.bottom < altura + 12 && r.top > window.innerHeight - r.bottom;
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
        left: Math.max(8, Math.min(r.left, window.innerWidth - LARGURA - 8)),
        width: LARGURA,
        fontFamily: estilo.fontFamily,
        ...(paraCima ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
      },
    });
  }

  useLayoutEffect(() => {
    if (!aberto) return;
    calcularPosicao();
    function atualizar(e) {
      if (painel.current?.contains(e.target)) return;
      calcularPosicao();
    }
    window.addEventListener('scroll', atualizar, true);
    window.addEventListener('resize', atualizar);
    return () => {
      window.removeEventListener('scroll', atualizar, true);
      window.removeEventListener('resize', atualizar);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function fora(e) {
      if (!caixa.current?.contains(e.target) && !painel.current?.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  function abrir() {
    setFoco(lerISO(value) ?? new Date());
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    gatilho.current?.focus();
  }

  function escolher(data) {
    onChange({ target: { value: data ? paraISO(data) : '' } });
    fechar();
  }

  function tecla(e) {
    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    const mover = {
      ArrowLeft: () => somarDias(foco, -1),
      ArrowRight: () => somarDias(foco, 1),
      ArrowUp: () => somarDias(foco, -7),
      ArrowDown: () => somarDias(foco, 7),
      PageUp: () => somarMeses(foco, -1),
      PageDown: () => somarMeses(foco, 1),
    }[e.key];
    if (mover) {
      e.preventDefault();
      setFoco(mover());
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      escolher(foco);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      fechar();
    } else if (e.key === 'Tab') {
      setAberto(false);
    }
  }

  return (
    <div ref={caixa} className={base.caixa}>
      <button
        ref={gatilho}
        type="button"
        id={idExterno}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={`${id}-calendario`}
        aria-invalid={erro || undefined}
        className={`${base.gatilho} ${compacto ? base.compacto : ''} ${aberto ? base.gatilhoAberto : ''}`}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={tecla}
      >
        <span className={texto ? base.valor : base.placeholder}>{texto || placeholder}</span>
        <svg className={styles.icone} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>

      {aberto && posicao && createPortal(
        <div
          ref={painel}
          id={`${id}-calendario`}
          role="dialog"
          aria-label="Escolher data"
          className={`${styles.painel} ${posicao.paraCima ? styles.paraCima : ''}`}
          style={posicao.estilo}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className={styles.topo}>
            <button type="button" className={styles.navegar} onClick={() => setFoco(somarMeses(foco, -1))} aria-label="Mês anterior">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <span key={tituloMes} className={styles.mes}>{tituloMes}</span>
            <button type="button" className={styles.navegar} onClick={() => setFoco(somarMeses(foco, 1))} aria-label="Próximo mês">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>

          <div className={styles.grade} role="grid">
            {SEMANA.map((d, i) => (
              <span key={i} className={styles.semana} aria-hidden="true">{d}</span>
            ))}
            {diasDoMes(foco).map((dia) => {
              const iso = paraISO(dia);
              const fora = dia.getMonth() !== foco.getMonth();
              const classes = [
                styles.dia,
                fora ? styles.fora : '',
                iso === hoje ? styles.hoje : '',
                iso === value ? styles.selecionado : '',
                iso === paraISO(foco) ? styles.focado : '',
              ].join(' ');
              return (
                <button
                  key={iso}
                  type="button"
                  tabIndex={-1}
                  className={classes}
                  aria-pressed={iso === value}
                  aria-label={dia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  onClick={() => escolher(dia)}
                >
                  {dia.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.rodape}>
            {!obrigatorio ? (
              <button type="button" className={styles.acao} onClick={() => escolher(null)}>Limpar</button>
            ) : <span />}
            <button type="button" className={styles.acao} onClick={() => escolher(new Date())}>Hoje</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}