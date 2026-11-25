'use client';

import { useEffect, useState } from 'react';
import styles from './EditarAluno.module.css';
import Selecao from './Selecao';

const SERIES = ['1', '2', '3'];
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TURNOS = ['Manhã', 'Tarde', 'Noite'];

function extrairSerieELetra(nome = '') {
  const limpo = String(nome).trim();
  const match = limpo.match(/^([123])(?:ª\s*Série\s*)?([A-Z])$/i);
  if (match) {
    return { serie: match[1], letra: match[2].toUpperCase() };
  }
  return { serie: '', letra: '' };
}

export default function NovaTurma({ turmas = [], turmaInicial = null, onSalvar, onFechar }) {
  const editando = Boolean(turmaInicial);
  const { serie: serieIni, letra: letraIni } = extrairSerieELetra(turmaInicial?.nome);

  const [form, setForm] = useState({
    serie: serieIni,
    letra: letraIni,
    turno: turmaInicial?.turno || turmaInicial?.periodo || '',
    ano_letivo: String(turmaInicial?.ano_letivo || new Date().getFullYear()),
  });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');

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

  const codigoTurma = form.serie && form.letra ? `${form.serie}${form.letra}` : '';
  const tituloTag = form.serie && form.letra ? `${codigoTurma} · ${form.serie}ª Série ${form.letra}` : 'Nova turma';

  function validar() {
    const e = {};
    if (!form.serie) e.serie = 'Selecione a série';
    if (!form.letra) e.letra = 'Selecione a letra';
    if (!form.turno) e.turno = 'Selecione o turno';

    const anoNum = Number(form.ano_letivo);
    if (!Number.isInteger(anoNum) || anoNum < 1901 || anoNum > 2155) {
      e.ano_letivo = 'Informe um ano letivo válido';
    }

    if (
      codigoTurma &&
      turmas.some(
        (t) =>
          String(t.nome || '').trim().toLowerCase() === codigoTurma.toLowerCase() &&
          Number(t.id) !== Number(turmaInicial?.id)
      )
    ) {
      e.letra = `A turma ${codigoTurma} já existe`;
    }
    return e;
  }

  async function salvar(evento) {
    evento.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    try {
      setSalvando(true);
      await onSalvar({
        nome: codigoTurma,
        turno: form.turno,
        periodo: form.turno,
        ano_letivo: Number(form.ano_letivo),
      });
      fechar();
    } catch (e) {
      setErros({ geral: e.message || 'Não foi possível salvar a turma.' });
    } finally {
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
            <span className={styles.tag}>{tituloTag}</span>
            <h2 id="titulo-nova-turma" className={styles.titulo}>
              {editando ? 'Gerenciar turma' : 'Adicionar turma'}
            </h2>
          </div>
          <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.conteudo}>
          <section className={styles.secao}>
            <Titulo numero="1" titulo="Identificação" texto="Série e letra formam o código da turma (ex.: 1A, 2B)" />
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
              <Campo label="Ano letivo" erro={erros.ano_letivo}>
                <input
                  type="number"
                  min={1901}
                  max={2155}
                  value={form.ano_letivo}
                  onChange={alterar('ano_letivo')}
                  placeholder="Ex.: 2026"
                />
              </Campo>
            </div>
          </section>

          {erros.geral && (
            <p className={styles.erro} style={{ marginTop: '0.5rem' }}>
              {erros.geral}
            </p>
          )}
        </div>

        <footer className={styles.rodape}>
          <button type="button" className={styles.btnSecundario} onClick={fechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimario} disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar turma'}
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