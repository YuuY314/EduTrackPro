"use client";

import { useEffect, useState } from "react";
import styles from "./cadastro.module.css";
import { admin } from "@/src/lib/api";
import Selecao from "@/src/components/Selecao";


const PERFIS = [
  { valor: "aluno", titulo: "Aluno", descricao: "Matrícula, turma e responsável", icone: "aluno" },
  { valor: "professor", titulo: "Professor", descricao: "Dados pessoais e contato", icone: "professor" },
  { valor: "admin", titulo: "Administrador", descricao: "Acesso total ao sistema", icone: "admin" },
];

const PARENTESCOS = ["Mãe", "Pai", "Avó", "Avô", "Tia", "Tio", "Irmã", "Irmão", "Outro"];

const usuarioInicial = { email: "", senha: "", confirmarSenha: "", perfil: "" };
const pessoaInicial = { nome: "", cpf: "", email: "", telefone: "" };
const alunoInicial = { id_turma: "", matricula: "", nome: "", cpf: "", endereco: "", email_institucional: "" };
const responsavelInicial = { nome: "", cpf: "", telefone: "", email: "", parentesco: "" };

function mascaraCpf(valor) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const cpfValido = (v) => v.replace(/\D/g, "").length === 11;
const telefoneValido = (v) => v.replace(/\D/g, "").length >= 10;

function validarPessoa(p, prefixo, erros, { exigeTelefone = true } = {}) {
  if (!p.nome.trim()) erros[`${prefixo}.nome`] = "Informe o nome";
  if (!cpfValido(p.cpf)) erros[`${prefixo}.cpf`] = "CPF incompleto";
  if (!emailValido(p.email)) erros[`${prefixo}.email`] = "Email inválido";
  if (exigeTelefone && !telefoneValido(p.telefone)) erros[`${prefixo}.telefone`] = "Telefone incompleto";
}

export default function CadastroPage() {
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [pessoa, setPessoa] = useState(pessoaInicial);
  const [usarMesmoEmail, setUsarMesmoEmail] = useState(true);
  const [aluno, setAluno] = useState(alunoInicial);
  const [modoResponsavel, setModoResponsavel] = useState("existente");
  const [idResponsavel, setIdResponsavel] = useState("");
  const [responsavel, setResponsavel] = useState(responsavelInicial);

  const [responsaveis, setResponsaveis] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [erroListas, setErroListas] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (usuario.perfil !== "aluno" || responsaveis.length || erroListas) return;
    admin.responsaveis()
      .then((r) => {
        setResponsaveis(r);
        if (!r.length) setModoResponsavel("novo");
      })
      .catch(() => {
        setErroListas("Não foi possível carregar os responsáveis já cadastrados. Cadastre um novo responsável.");
        setModoResponsavel("novo");
      });
  }, [usuario.perfil, responsaveis.length, erroListas]);

  useEffect(() => {
    admin.turmas().then(setTurmas).catch(() => {});
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const emailPessoa = usarMesmoEmail ? usuario.email : pessoa.email;

  function alterar(setter, campo, mascara) {
    return (e) => {
      const valor = mascara ? mascara(e.target.value) : e.target.value;
      setter((anterior) => ({ ...anterior, [campo]: valor }));
    };
  }

  function validar() {
    const e = {};
    if (!emailValido(usuario.email)) e["usuario.email"] = "Email inválido";
    if (usuario.senha.length < 8) e["usuario.senha"] = "Mínimo de 8 caracteres";
    if (usuario.confirmarSenha !== usuario.senha) e["usuario.confirmarSenha"] = "As senhas não conferem";
    if (!usuario.perfil) e["usuario.perfil"] = "Selecione um perfil";

    if (usuario.perfil === "professor" || usuario.perfil === "admin") {
      validarPessoa({ ...pessoa, email: emailPessoa }, "pessoa", e);
    }

    if (usuario.perfil === "aluno") {
      if (!aluno.id_turma) e["aluno.id_turma"] = "Selecione a turma";
      if (!aluno.matricula.trim()) e["aluno.matricula"] = "Informe a matrícula";
      if (!aluno.nome.trim()) e["aluno.nome"] = "Informe o nome";
      if (!cpfValido(aluno.cpf)) e["aluno.cpf"] = "CPF incompleto";
      if (!aluno.endereco.trim()) e["aluno.endereco"] = "Informe o endereço";
      if (!emailValido(aluno.email_institucional)) e["aluno.email_institucional"] = "Email inválido";

      if (modoResponsavel === "existente" && !idResponsavel) {
        e["responsavel.id"] = "Selecione o responsável";
      }
      if (modoResponsavel === "novo") {
        validarPessoa(responsavel, "responsavel", e);
        if (!responsavel.parentesco) e["responsavel.parentesco"] = "Selecione o parentesco";
      }
    }
    return e;
  }

  async function cadastrar() {
    const { email, senha, perfil } = usuario;
    // email_login = e-mail de acesso (seção 1); email = contato (seção 2).
    // Antes, com "Usar o mesmo email" desmarcado, o e-mail de acesso digitado
    // era descartado e a pessoa só entrava com o e-mail de contato.
    const dadosPessoa = { ...pessoa, email: emailPessoa, email_login: email, senha };
    if (perfil === "professor") return admin.criarProfessor(dadosPessoa);
    if (perfil === "admin") return admin.criarAdministrador(dadosPessoa);
    return admin.criarAluno({
      ...aluno,
      senha,
      id_turma: Number(aluno.id_turma),
      ...(modoResponsavel === "existente"
        ? { id_responsavel: Number(idResponsavel) }
        : { responsavel }),
    });
  }

  function limpar() {
    setUsuario(usuarioInicial);
    setPessoa(pessoaInicial);
    setUsarMesmoEmail(true);
    setAluno(alunoInicial);
    setIdResponsavel("");
    setResponsavel(responsavelInicial);
    setErros({});
  }

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length) {
      setAviso({ tipo: "erro", texto: "Confira os campos destacados." });
      return;
    }

    setEnviando(true);
    try {
      await cadastrar();
      setAviso({ tipo: "sucesso", texto: "Cadastro realizado com sucesso!" });
      limpar();
    } catch (err) {
      setAviso({ tipo: "erro", texto: err.message || "Erro de conexão com o servidor." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={enviar} noValidate>
        <header className={styles.header}>
          <span className={styles.tag}>Área do administrador</span>
          <h1 className={styles.title}>Novo cadastro</h1>
          <p className={styles.subtitle}>Crie o acesso e preencha os dados de acordo com o perfil.</p>
        </header>

        <section className={styles.card}>
          <SectionTitle numero="1" titulo="Usuário" texto="Dados de acesso ao sistema" />

          <div className={styles.grid}>
            <Campo label="Email" erro={erros["usuario.email"]} full>
              <input
                type="email"
                autoComplete="off"
                placeholder="nome@exemplo.com"
                value={usuario.email}
                onChange={alterar(setUsuario, "email")}
              />
            </Campo>

            <Campo label="Senha" erro={erros["usuario.senha"]}>
              <div className={styles.senha}>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  value={usuario.senha}
                  onChange={alterar(setUsuario, "senha")}
                />
                <button
                  type="button"
                  className={styles.olho}
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </Campo>

            <Campo label="Confirmar senha" erro={erros["usuario.confirmarSenha"]}>
              <input
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={usuario.confirmarSenha}
                onChange={alterar(setUsuario, "confirmarSenha")}
              />
            </Campo>
          </div>

          <p className={`${styles.label} ${styles.perfilLabel}`}>Perfil</p>
          <div className={styles.perfis} role="radiogroup" aria-label="Perfil">
            {PERFIS.map((p) => (
              <label
                key={p.valor}
                className={`${styles.perfil} ${usuario.perfil === p.valor ? styles.perfilAtivo : ""}`}
              >
                <input
                  type="radio"
                  name="perfil"
                  value={p.valor}
                  checked={usuario.perfil === p.valor}
                  onChange={alterar(setUsuario, "perfil")}
                />
                <Icone tipo={p.icone} />
                <span className={styles.perfilTitulo}>{p.titulo}</span>
                <span className={styles.perfilTexto}>{p.descricao}</span>
              </label>
            ))}
          </div>
          {erros["usuario.perfil"] && <span className={styles.erro}>{erros["usuario.perfil"]}</span>}
        </section>

        {(usuario.perfil === "professor" || usuario.perfil === "admin") && (
          <section key={usuario.perfil} className={`${styles.card} ${styles.entrar}`}>
            <SectionTitle
              numero="2"
              titulo={usuario.perfil === "professor" ? "Dados do professor" : "Dados do administrador"}
              texto="Informações pessoais e de contato"
            />
            <div className={styles.grid}>
              <Campo label="Nome completo" erro={erros["pessoa.nome"]} full>
                <input value={pessoa.nome} onChange={alterar(setPessoa, "nome")} placeholder="Nome e sobrenome" />
              </Campo>
              <Campo label="CPF" erro={erros["pessoa.cpf"]}>
                <input
                  inputMode="numeric"
                  value={pessoa.cpf}
                  onChange={alterar(setPessoa, "cpf", mascaraCpf)}
                  placeholder="000.000.000-00"
                />
              </Campo>
              <Campo label="Telefone" erro={erros["pessoa.telefone"]}>
                <input
                  inputMode="tel"
                  value={pessoa.telefone}
                  onChange={alterar(setPessoa, "telefone", mascaraTelefone)}
                  placeholder="(00) 00000-0000"
                />
              </Campo>
              <Campo label="Email de contato" erro={erros["pessoa.email"]} full>
                <input
                  type="email"
                  value={emailPessoa}
                  disabled={usarMesmoEmail}
                  onChange={alterar(setPessoa, "email")}
                  placeholder="nome@exemplo.com"
                />
              </Campo>
              <label className={`${styles.check} ${styles.full}`}>
                <input
                  type="checkbox"
                  checked={usarMesmoEmail}
                  onChange={(e) => {
                    setUsarMesmoEmail(e.target.checked);
                    if (!e.target.checked) setPessoa((p) => ({ ...p, email: usuario.email }));
                  }}
                />
                Usar o mesmo email do usuário
              </label>
            </div>
          </section>
        )}

        {usuario.perfil === "aluno" && (
          <>
            <section className={`${styles.card} ${styles.entrar}`}>
              <SectionTitle numero="2" titulo="Dados do aluno" texto="Matrícula, turma e informações pessoais" />
              {erroListas && <p className={styles.alerta}>{erroListas}</p>}
              <div className={styles.grid}>
                <Campo label="Turma" erro={erros["aluno.id_turma"]}>
                  <Selecao
                    value={aluno.id_turma}
                    onChange={alterar(setAluno, "id_turma")}
                    placeholder="Selecione a turma"
                    erro={Boolean(erros["aluno.id_turma"])}
                    opcoes={turmas.map((t) => ({ value: t.id, label: t.nome, detalhe: t.turno }))}
                  />
                </Campo>
                <Campo label="Matrícula" erro={erros["aluno.matricula"]}>
                  <input
                    value={aluno.matricula}
                    maxLength={20}
                    onChange={alterar(setAluno, "matricula")}
                    placeholder="Ex.: 2026001"
                  />
                </Campo>
                <Campo label="Nome completo" erro={erros["aluno.nome"]} full>
                  <input value={aluno.nome} onChange={alterar(setAluno, "nome")} placeholder="Nome e sobrenome" />
                </Campo>
                <Campo label="CPF" erro={erros["aluno.cpf"]}>
                  <input
                    inputMode="numeric"
                    value={aluno.cpf}
                    onChange={alterar(setAluno, "cpf", mascaraCpf)}
                    placeholder="000.000.000-00"
                  />
                </Campo>
                <Campo label="Email institucional" erro={erros["aluno.email_institucional"]}>
                  <input
                    type="email"
                    value={aluno.email_institucional}
                    onChange={alterar(setAluno, "email_institucional")}
                    placeholder="aluno@escola.edu.br"
                  />
                </Campo>
                <Campo label="Endereço" erro={erros["aluno.endereco"]} full>
                  <input
                    value={aluno.endereco}
                    maxLength={200}
                    onChange={alterar(setAluno, "endereco")}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </Campo>
              </div>
            </section>

            <section className={`${styles.card} ${styles.entrar} ${styles.atraso}`}>
              <SectionTitle numero="3" titulo="Responsável" texto="Associe um responsável já cadastrado ou cadastre um novo" />

              <div className={styles.abas} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={modoResponsavel === "existente"}
                  className={modoResponsavel === "existente" ? styles.abaAtiva : ""}
                  onClick={() => setModoResponsavel("existente")}
                >
                  Já cadastrado
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={modoResponsavel === "novo"}
                  className={modoResponsavel === "novo" ? styles.abaAtiva : ""}
                  onClick={() => setModoResponsavel("novo")}
                >
                  Cadastrar novo
                </button>
              </div>

              {modoResponsavel === "existente" ? (
                <div key="existente" className={`${styles.grid} ${styles.entrar}`}>
                  <Campo label="Responsável" erro={erros["responsavel.id"]} full>
                    <Selecao
                      value={idResponsavel}
                      onChange={(e) => setIdResponsavel(e.target.value)}
                      placeholder="Selecione o responsável"
                      erro={Boolean(erros["responsavel.id"])}
                      opcoes={responsaveis.map((r) => ({ value: r.id_responsavel, label: r.nome, detalhe: r.cpf }))}
                    />
                  </Campo>
                </div>
              ) : (
                <div key="novo" className={`${styles.grid} ${styles.entrar}`}>
                  <Campo label="Nome completo" erro={erros["responsavel.nome"]} full>
                    <input
                      value={responsavel.nome}
                      onChange={alterar(setResponsavel, "nome")}
                      placeholder="Nome e sobrenome"
                    />
                  </Campo>
                  <Campo label="CPF" erro={erros["responsavel.cpf"]}>
                    <input
                      inputMode="numeric"
                      value={responsavel.cpf}
                      onChange={alterar(setResponsavel, "cpf", mascaraCpf)}
                      placeholder="000.000.000-00"
                    />
                  </Campo>
                  <Campo label="Parentesco" erro={erros["responsavel.parentesco"]}>
                    <Selecao
                      value={responsavel.parentesco}
                      onChange={alterar(setResponsavel, "parentesco")}
                      erro={Boolean(erros["responsavel.parentesco"])}
                      opcoes={PARENTESCOS.map((p) => ({ value: p, label: p }))}
                    />
                  </Campo>
                  <Campo label="Telefone" erro={erros["responsavel.telefone"]}>
                    <input
                      inputMode="tel"
                      value={responsavel.telefone}
                      onChange={alterar(setResponsavel, "telefone", mascaraTelefone)}
                      placeholder="(00) 00000-0000"
                    />
                  </Campo>
                  <Campo label="Email" erro={erros["responsavel.email"]}>
                    <input
                      type="email"
                      value={responsavel.email}
                      onChange={alterar(setResponsavel, "email")}
                      placeholder="nome@exemplo.com"
                    />
                  </Campo>
                </div>
              )}
            </section>
          </>
        )}

        <div className={styles.rodape}>
          <button type="button" className={styles.btnSecundario} onClick={limpar} disabled={enviando}>
            Limpar
          </button>
          <button type="submit" className={styles.btnPrimario} disabled={enviando || !usuario.perfil}>
            {enviando && <span className={styles.spinner} aria-hidden="true" />}
            {enviando ? "Salvando..." : "Cadastrar"}
          </button>
        </div>
      </form>

      {aviso && (
        <div
          role="status"
          className={`${styles.toast} ${aviso.tipo === "sucesso" ? styles.toastSucesso : styles.toastErro}`}
        >
          {aviso.texto}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ numero, titulo, texto }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.numero}>{numero}</span>
      <div>
        <h2>{titulo}</h2>
        <p>{texto}</p>
      </div>
    </div>
  );
}

function Campo({ label, erro, full, children }) {
  return (
    <label className={`${styles.campo} ${full ? styles.full : ""} ${erro ? styles.comErro : ""}`}>
      <span className={styles.label}>{label}</span>
      {children}
      {erro && <span className={styles.erro}>{erro}</span>}
    </label>
  );
}

function Icone({ tipo }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: styles.perfilIcone,
    "aria-hidden": true,
  };
  if (tipo === "aluno") {
    return (
      <svg {...props}>
        <path d="M2 9l10-5 10 5-10 5z" />
        <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
        <path d="M22 9v6" />
      </svg>
    );
  }
  if (tipo === "professor") {
    return (
      <svg {...props}>
        <path d="M3 5h12v9H3z" />
        <path d="M7 18l2-4M13 18l-2-4" />
        <circle cx="19" cy="8" r="2" />
        <path d="M16 21v-3a3 3 0 0 1 6 0v3" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}