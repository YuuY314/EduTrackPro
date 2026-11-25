'use client';

import { useEffect, useState } from 'react';
import styles from './EditarAluno.module.css';
import Selecao from './Selecao';
import SecaoHorarios, { limparHorarios } from './SecaoHorarios';

function mascaraCpf(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const cpfValido = (v) => v.replace(/\D/g, '').length === 11;
const telefoneValido = (v) => v.replace(/\D/g, '').length >= 10;


function montarForm(professor, turmas) {
  const idsVinculados = professor.ids_turmas
    ?? (professor.vinculos ? [...new Set(professor.vinculos.map((v) => Number(v.id_turma)))] : []);

  let disciplinasIniciais = [];
  if (Array.isArray(professor.disciplinas)) {
    disciplinasIniciais = professor.disciplinas;
  } else if (professor.disciplina && professor.disciplina !== 'Sem disciplina') {
    disciplinasIniciais = professor.disciplina.split(',').map((d) => d.trim()).filter(Boolean);
  }
  return {
    nome: professor.nome ?? '',
    cpf: professor.cpf ?? '',
    telefone: professor.telefone ?? '',
    email: professor.email ?? '',
    disciplinas: disciplinasIniciais,
    turmas: idsVinculados,
  };
}

export default function EditarProfessor({ professor, disciplinas, turmas, onSalvar, onFechar }) {
  const [form, setForm] = useState(() => montarForm(professor, turmas));
  const [erros, setErros] = useState({});
  const [fechando, setFechando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [horarios, setHorarios] = useState(professor.horarios ?? []);

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

  function alterar(campo, mascara) {
    return (e) => {
      const bruto = e?.target !== undefined ? e.target.value : e;
      const valor = mascara ? mascara(bruto) : bruto;
      setForm((f) => ({ ...f, [campo]: valor }));
    };
  }


  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome';
    if (form.cpf && !cpfValido(form.cpf)) e.cpf = 'CPF incompleto';
    if (form.telefone && !telefoneValido(form.telefone)) e.telefone = 'Telefone incompleto';
    if (form.email && !emailValido(form.email)) e.email = 'Email inválido';
    if (!form.disciplinas || form.disciplinas.length === 0) {
      e.disciplinas = 'Selecione ao menos uma disciplina';
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
      await onSalvar({
        nome: form.nome.trim(),
        cpf: form.cpf,
        telefone: form.telefone,
        email: form.email.trim(),
        disciplinas: form.disciplinas,
        disciplina: form.disciplinas.join(', '),
        id_turmas: form.turmas.map(Number),
        horarios: limparHorarios(horarios),
      });
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
        aria-labelledby="titulo-editar-professor"
      >
        <header className={styles.topo}>
          <div>
            <span className={styles.tag}>Professor</span>
            <h2 id="titulo-editar-professor" className={styles.titulo}>Editar professor</h2>
          </div>
          <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.conteudo}>
          {erroEnvio && <p className={styles.erro}>{erroEnvio}</p>}

          <section className={styles.secao}>
            <Titulo numero="1" titulo="Dados pessoais" texto="Informações pessoais e de contato" />
            <div className={styles.grid}>
              <Campo label="Nome completo" erro={erros.nome} full>
                <input value={form.nome} onChange={alterar('nome')} placeholder="Nome e sobrenome" autoFocus />
              </Campo>
              <Campo label="CPF" erro={erros.cpf}>
                <input
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={alterar('cpf', mascaraCpf)}
                  placeholder="000.000.000-00"
                />
              </Campo>
              <Campo label="Telefone" erro={erros.telefone}>
                <input
                  inputMode="tel"
                  value={form.telefone}
                  onChange={alterar('telefone', mascaraTelefone)}
                  placeholder="(00) 00000-0000"
                />
              </Campo>
              <Campo label="Email" erro={erros.email} full>
                <input
                  type="email"
                  value={form.email}
                  onChange={alterar('email')}
                  placeholder="nome@exemplo.com"
                />
              </Campo>
            </div>
          </section>

          <section className={`${styles.secao} ${styles.atraso}`}>
            <Titulo numero="2" titulo="Aulas" texto="Disciplinas e turmas atendidas" />
            <div className={styles.grid}>
              <Campo label="Disciplinas" erro={erros.disciplinas}>
                <Selecao
                  multiplo
                  value={form.disciplinas}
                  onChange={alterar('disciplinas')}
                  placeholder="Selecione as disciplinas"
                  erro={Boolean(erros.disciplinas)}
                  opcoes={disciplinas.map((d) => ({ value: d, label: d }))}
                />
              </Campo>
              <Campo label="Turmas">
                <Selecao
                  multiplo
                  value={form.turmas}
                  onChange={alterar('turmas')}
                  placeholder="Selecione as turmas"
                  opcoes={turmas.map((t) => ({ value: t.id, label: t.nome, detalhe: t.turno }))}
                />
              </Campo>
            </div>
          </section>

          <SecaoHorarios
            turmas={turmas}
            selecionadas={form.turmas}
            disciplinas={form.disciplinas}
            value={horarios}
            onChange={setHorarios}
          />
        </div>

        <footer className={styles.rodape}>
          <button type="button" className={styles.btnSecundario} onClick={fechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimario} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
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