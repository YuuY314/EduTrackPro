'use client';

import { useEffect, useState } from 'react';
import styles from './EditarAluno.module.css';
import Selecao from './Selecao';

const SERIES = ['1', '2', '3'];
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TURNOS = ['Manhã', 'Tarde', 'Noite'];

const vazio = { serie: '', letra: '', turno: '', ano: String(new Date().getFullYear()) };

export default function NovaTurma({ turmas, onSalvar, onFechar }) {
  const [form, setForm] = useState(vazio);
  const [erros, setErros] = useState({});
  const [fechando, setFechando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function tecla(e) {
      if (e.key === 'Escape') fechar();
    }
    window.addEventListener('keydown', tecla);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', tecla);
    };
  }, []);

  function fechar() {
    setFechando(true);
    setTimeout(onFechar, 220);
  }

  function alterar(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  const nome = form.serie && form.letra ? `${form.serie}ª Série ${form.letra}` : '';

  function validar() {
    const e = {};
    if (!form.serie) e.serie = 'Selecione a série';
    if (!form.letra) e.letra = 'Selecione a letra';
    if (!form.turno) e.turno = 'Selecione o turno';
    if (!/^\d{4}$/.test(form.ano)) e.ano = 'Informe um ano válido';
    if (form.serie && form.letra && turmas.some((t) => t.nomeCurto === `${form.serie}${form.letra}` && String(t.ano_letivo) === form.ano)) {
      e.letra = `A ${nome} já existe`;
    }
    return e;
  }

  async function salvar(evento) {
    evento.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    setSalvando(true);
    setErroEnvio('');
    try {
      await onSalvar({ nome: `${form.serie}${form.letra}`, periodo: form.turno, ano_letivo: Number(form.ano) });
      fechar();
    } catch (err) {
      setErroEnvio(err.message);
      setSalvando(false);
    }
  }

  return (
    <div
      className={`${styles.fundo} ${fechando ? styles.saindo : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && fechar()}
    >
      <form
        className={styles.painel}
        onSubmit={salvar}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nova-turma"
      >
        <header className={styles.topo}>
          <div>
            <span className={styles.tag}>{nome || 'Nova turma'}</span>
            <h2 id="titulo-nova-turma" className={styles.titulo}>Adicionar turma</h2>
          </div>
          <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.conteudo}>
          <section className={styles.secao}>
            <Titulo numero="1" titulo="Identificação" texto="Série e letra formam o nome da turma" />
            <div className={styles.grid}>
              <Campo label="Série" erro={erros.serie}>
                <Selecao
                  autoFocus
                  value={form.serie}
                  onChange={alterar('serie')}
                  erro={Boolean(erros.serie)}
                  opcoes={SERIES.map((s) => ({ value: s, label: `${s}ª Série` }))}
                />
              </Campo>
              <Campo label="Letra" erro={erros.letra}>
                <Selecao
                  value={form.letra}
                  onChange={alterar('letra')}
                  erro={Boolean(erros.letra)}
                  opcoes={LETRAS.map((l) => ({ value: l, label: l }))}
                />
              </Campo>
            </div>
          </section>

          <section className={`${styles.secao} ${styles.atraso}`}>
            <Titulo numero="2" titulo="Funcionamento" texto="Turno e ano letivo da turma" />
            <div className={styles.grid}>
              <Campo label="Turno" erro={erros.turno}>
                <Selecao
                  value={form.turno}
                  onChange={alterar('turno')}
                  erro={Boolean(erros.turno)}
                  opcoes={TURNOS.map((t) => ({ value: t, label: t }))}
                />
              </Campo>
              <Campo label="Ano letivo" erro={erros.ano}>
                <input value={form.ano} onChange={alterar('ano')} inputMode="numeric" maxLength={4} placeholder="2026" />
              </Campo>
            </div>
          </section>
        </div>

        <footer className={styles.rodape}>
          {erroEnvio && <span className={styles.erro} role="alert">{erroEnvio}</span>}
          <button type="button" className={styles.btnSecundario} onClick={fechar}>Cancelar</button>
          <button type="submit" className={styles.btnPrimario} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Adicionar turma'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Titulo({ numero, titulo, texto }) {
  return (
    <div className={styles.secaoTitulo}>
      <span className={styles.numero}>{numero}</span>
      <div>
        <h3>{titulo}</h3>
        <p>{texto}</p>
      </div>
    </div>
  );
}

function Campo({ label, erro, full, children }) {
  return (
    <label className={`${styles.campo} ${full ? styles.full : ''} ${erro ? styles.comErro : ''}`}>
      <span className={styles.label}>{label}</span>
      {children}
      {erro && <span className={styles.erro}>{erro}</span>}
    </label>
  );
}