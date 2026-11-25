'use client';

import { useEffect, useState } from 'react';
import styles from './EditarAluno.module.css';
import SecaoHorarios, { limparHorarios, temProblemaNosHorarios } from './SecaoHorarios';
import SecaoVinculos, { chaveOcupacao } from './SecaoVinculos';

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


// Vínculos e horários viram linhas com uma "_chave" própria: o horário aponta
// para a linha da aula (turma + disciplina). Assim, trocar a disciplina de uma
// linha leva os horários junto, e remover a linha remove os horários dela.
function montarForm(professor) {
  const vinculos = (professor.vinculos ?? []).map((v) => ({
    _chave: `v${v.id_tdp}`,
    id_tdp: v.id_tdp,
    id_turma: String(v.id_turma),
    disciplina: v.disciplina ?? '',
    em_uso: Boolean(v.em_uso),
  }));
  const horarios = (professor.horarios ?? []).map((h) => ({
    _chave: `h${h.id}`,
    vinculo: `v${h.id_tdp}`,
    dia: String(h.dia ?? ''),
    hora_inicio: h.hora_inicio ?? '',
    hora_fim: h.hora_fim ?? '',
    sala: h.sala ?? null,
  }));
  return {
    dados: {
      nome: professor.nome ?? '',
      cpf: professor.cpf ?? '',
      telefone: professor.telefone ?? '',
      email: professor.email ?? '',
    },
    vinculos,
    horarios,
  };
}

export default function EditarProfessor({
  professor,
  disciplinas,
  turmas,
  ocupacao,
  ocupados,
  professores = [],
  onSalvar,
  onTransferir,
  onFechar,
}) {
  const [inicial] = useState(() => montarForm(professor));
  const [form, setForm] = useState(inicial.dados);
  const [vinculos, setVinculos] = useState(inicial.vinculos);
  const [horarios, setHorarios] = useState(inicial.horarios);
  const [erros, setErros] = useState({});
  const [fechando, setFechando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [salvando, setSalvando] = useState(false);
  const idProfessor = professor.id_professor ?? professor.id;

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

  // Remover uma linha de "Aulas" remove também os horários dela
  function mudarVinculos(lista) {
    const chaves = new Set(lista.map((v) => v._chave));
    setVinculos(lista);
    setHorarios((hs) => hs.filter((h) => !h.vinculo || chaves.has(h.vinculo)));
  }

  // A transferência é gravada na hora (POST /professor/:id/transferir). Depois
  // disso a linha e os horários dela saem deste formulário, porque agora são
  // do outro professor; o resto do que foi editado aqui continua sem salvar.
  async function transferir(vinculo, idDestino) {
    await onTransferir(vinculo.id_tdp, idDestino);
    setVinculos((vs) => vs.filter((v) => v._chave !== vinculo._chave));
    setHorarios((hs) => hs.filter((h) => h.vinculo !== vinculo._chave));
  }

  const horariosPorVinculo = horarios.reduce((acc, h) => ({ ...acc, [h.vinculo]: (acc[h.vinculo] ?? 0) + 1 }), {});

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome';
    // CPF e e-mail são obrigatórios no banco: vazio dava "Erro interno no servidor"
    if (!cpfValido(form.cpf)) e.cpf = 'CPF incompleto';
    if (form.telefone && !telefoneValido(form.telefone)) e.telefone = 'Telefone incompleto';
    if (!emailValido(form.email)) e.email = 'Email inválido';

    const incompletos = vinculos.some((v) => !v.id_turma || !v.disciplina);
    const pares = vinculos.map((v) => `${v.id_turma}|${v.disciplina.toLowerCase()}`);
    if (incompletos) e.vinculos = 'Escolha a turma e a disciplina de cada linha (ou remova a linha).';
    else if (new Set(pares).size !== pares.length) e.vinculos = 'Há turma e disciplina repetidas.';
    else if (
      vinculos.some((v) => {
        const dono = ocupacao.get(chaveOcupacao(v.id_turma, v.disciplina));
        return dono && Number(dono.id_professor) !== Number(idProfessor);
      })
    ) {
      e.vinculos = 'Uma das disciplinas já tem outro professor nessa turma.';
    }

    const problemaHorario = temProblemaNosHorarios(horarios, vinculos, turmas, ocupados, idProfessor);
    if (problemaHorario) e.horarios = problemaHorario;
    return e;
  }

  async function salvar(evento) {
    evento.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length) {
      setErroEnvio(encontrados.horarios || encontrados.vinculos || 'Confira os campos destacados.');
      return;
    }

    setSalvando(true);
    setErroEnvio('');
    try {
      await onSalvar({
        nome: form.nome.trim(),
        cpf: form.cpf,
        telefone: form.telefone,
        email: form.email.trim(),
        vinculos: vinculos.map((v) => ({ id_turma: Number(v.id_turma), disciplina: v.disciplina })),
        horarios: limparHorarios(horarios, vinculos),
      });
      fechar();
    } catch (err) {
      // o modal continua aberto com o motivo; antes ele fechava e as
      // alterações "sumiam" sem explicação
      setErroEnvio(err.message || 'Não foi possível salvar.');
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

          <SecaoVinculos
            turmas={turmas}
            disciplinas={disciplinas}
            value={vinculos}
            onChange={mudarVinculos}
            ocupacao={ocupacao}
            idProfessor={idProfessor}
            horariosPorVinculo={horariosPorVinculo}
            professores={professores}
            onTransferir={onTransferir ? transferir : undefined}
            erro={erros.vinculos}
          />

          <SecaoHorarios
            vinculos={vinculos}
            turmas={turmas}
            value={horarios}
            onChange={setHorarios}
            ocupados={ocupados}
            idProfessor={idProfessor}
          />
        </div>

        <footer className={styles.rodape}>
          {erroEnvio && <span className={styles.erro} role="alert">{erroEnvio}</span>}
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