'use client';

import { useEffect, useState } from 'react';
import styles from './EditarAluno.module.css';
import Selecao from './Selecao';

const PARENTESCOS = ['Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Irmã', 'Irmão', 'Outro'];

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

function montarForm(aluno, turmas) {
  const turma =
    turmas.find((t) => Number(t.id) === Number(aluno.id_turma)) ||
    turmas.find((t) => t.nome === aluno.turma && t.turno === aluno.turno);
  const resp = aluno.responsavelDados || {};
  return {
    aluno: {
      turma: turma?.id ?? turmas[0]?.id ?? '',
      nome: aluno.nome ?? '',
      cpf: aluno.cpf ?? '',
      email_institucional: aluno.email_institucional ?? '',
      endereco: aluno.endereco ?? '',
    },
    responsavel: {
      nome: resp.nome ?? aluno.responsavel ?? '',
      cpf: resp.cpf ?? '',
      parentesco: resp.parentesco ?? '',
      telefone: resp.telefone ?? '',
      email: resp.email ?? '',
    },
  };
}

export default function EditarAluno({ aluno, turmas, onSalvar, onFechar }) {
  const [form, setForm] = useState(() => montarForm(aluno, turmas));
  const [erros, setErros] = useState({});
  const [fechando, setFechando] = useState(false);

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

  function alterar(secao, campo, mascara) {
    return (e) => {
      const valor = mascara ? mascara(e.target.value) : e.target.value;
      setForm((f) => ({ ...f, [secao]: { ...f[secao], [campo]: valor } }));
    };
  }

  function validar() {
    const e = {};
    const { aluno: a, responsavel: r } = form;
    if (!a.nome.trim()) e['aluno.nome'] = 'Informe o nome';
    if (a.cpf && !cpfValido(a.cpf)) e['aluno.cpf'] = 'CPF incompleto';
    if (a.email_institucional && !emailValido(a.email_institucional)) e['aluno.email_institucional'] = 'Email inválido';
    if (!r.nome.trim()) e['responsavel.nome'] = 'Informe o nome do responsável';
    if (r.cpf && !cpfValido(r.cpf)) e['responsavel.cpf'] = 'CPF incompleto';
    if (r.telefone && !telefoneValido(r.telefone)) e['responsavel.telefone'] = 'Telefone incompleto';
    if (r.email && !emailValido(r.email)) e['responsavel.email'] = 'Email inválido';
    return e;
  }

  function salvar(evento) {
    evento.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    const turma = turmas.find((t) => String(t.id) === String(form.aluno.turma));
    const { aluno: a, responsavel: r } = form;
    onSalvar({
      id_turma: Number(form.aluno.turma),
      nome: a.nome.trim(),
      turma: turma?.nome ?? aluno.turma,
      turno: turma?.turno ?? aluno.turno,
      cpf: a.cpf,
      email_institucional: a.email_institucional.trim(),
      endereco: a.endereco.trim(),
      responsavel: r.nome.trim(),
      responsavelDados: { ...r, nome: r.nome.trim(), email: r.email.trim() },
    });
    fechar();
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
        aria-labelledby="titulo-editar"
      >
        <header className={styles.topo}>
          <div>
            <span className={styles.tag}>Matrícula {aluno.matricula}</span>
            <h2 id="titulo-editar" className={styles.titulo}>Editar aluno</h2>
          </div>
          <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.conteudo}>
          <section className={styles.secao}>
            <Titulo numero="1" titulo="Dados do aluno" texto="Turma e informações pessoais" />
            <div className={styles.grid}>
              <Campo label="Turma">
                <Selecao
                  value={form.aluno.turma}
                  onChange={alterar('aluno', 'turma')}
                  opcoes={turmas.map((t) => ({ value: t.id, label: t.nome, detalhe: t.turno }))}
                />
              </Campo>
              <Campo label="Matrícula">
                <input value={aluno.matricula} disabled />
              </Campo>
              <Campo label="Nome completo" erro={erros['aluno.nome']} full>
                <input value={form.aluno.nome} onChange={alterar('aluno', 'nome')} placeholder="Nome e sobrenome" autoFocus />
              </Campo>
              <Campo label="CPF" erro={erros['aluno.cpf']}>
                <input
                  inputMode="numeric"
                  value={form.aluno.cpf}
                  onChange={alterar('aluno', 'cpf', mascaraCpf)}
                  placeholder="000.000.000-00"
                />
              </Campo>
              <Campo label="Email institucional" erro={erros['aluno.email_institucional']}>
                <input
                  type="email"
                  value={form.aluno.email_institucional}
                  onChange={alterar('aluno', 'email_institucional')}
                  placeholder="aluno@escola.edu.br"
                />
              </Campo>
              <Campo label="Endereço" full>
                <input
                  value={form.aluno.endereco}
                  maxLength={200}
                  onChange={alterar('aluno', 'endereco')}
                  placeholder="Rua, número, bairro, cidade"
                />
              </Campo>
            </div>
          </section>

          <section className={`${styles.secao} ${styles.atraso}`}>
            <Titulo numero="2" titulo="Responsável" texto="Dados de contato do responsável" />
            <div className={styles.grid}>
              <Campo label="Nome completo" erro={erros['responsavel.nome']} full>
                <input value={form.responsavel.nome} onChange={alterar('responsavel', 'nome')} placeholder="Nome e sobrenome" />
              </Campo>
              <Campo label="CPF" erro={erros['responsavel.cpf']}>
                <input
                  inputMode="numeric"
                  value={form.responsavel.cpf}
                  onChange={alterar('responsavel', 'cpf', mascaraCpf)}
                  placeholder="000.000.000-00"
                />
              </Campo>
              <Campo label="Parentesco">
                <Selecao
                  value={form.responsavel.parentesco}
                  onChange={alterar('responsavel', 'parentesco')}
                  opcoes={PARENTESCOS.map((p) => ({ value: p, label: p }))}
                />
              </Campo>
              <Campo label="Telefone" erro={erros['responsavel.telefone']}>
                <input
                  inputMode="tel"
                  value={form.responsavel.telefone}
                  onChange={alterar('responsavel', 'telefone', mascaraTelefone)}
                  placeholder="(00) 00000-0000"
                />
              </Campo>
              <Campo label="Email" erro={erros['responsavel.email']}>
                <input
                  type="email"
                  value={form.responsavel.email}
                  onChange={alterar('responsavel', 'email')}
                  placeholder="nome@exemplo.com"
                />
              </Campo>
            </div>
          </section>
        </div>

        <footer className={styles.rodape}>
          <button type="button" className={styles.btnSecundario} onClick={fechar}>Cancelar</button>
          <button type="submit" className={styles.btnPrimario}>Salvar alterações</button>
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