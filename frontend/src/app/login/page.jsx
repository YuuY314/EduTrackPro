'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { perfis } from '@/lib/dados';
import './login.css';

const opcoesPerfil = [
  { valor: 'aluno', nome: 'Aluno' },
  { valor: 'professor', nome: 'Professor' },
  { valor: 'admin', nome: 'Administração' },
];

export default function LoginPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState('aluno');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [entrando, setEntrando] = useState(false);

  function entrar(evento) {
    evento.preventDefault();

    const novosErros = {};
    if (usuario.trim() === '') novosErros.usuario = 'Digite seu e-mail ou RA.';
    if (senha === '') novosErros.senha = 'Digite sua senha.';
    else if (senha.length < 4) novosErros.senha = 'A senha precisa ter pelo menos 4 caracteres.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEntrando(true);
    router.push(perfis[perfil].inicio);
  }

  return (
    <div className="login">

      <section className="login-marca">
        <div className="login-marca-conteudo">
          <Image src="/img/logo.svg" alt="" width={72} height={72} priority />
          <h1>Sophos Academy</h1>
          <p>Notas, presença e agenda da escola num só lugar.</p>
        </div>
      </section>

      <section className="login-area">
        <form className="login-form" onSubmit={entrar} noValidate>
          <h2>Entrar</h2>
          <p className="login-subtitulo">Use o acesso fornecido pela secretaria da escola.</p>

          <fieldset className="login-perfil">
            <legend>Eu sou</legend>
            {opcoesPerfil.map((opcao) => (
              <label key={opcao.valor} className={perfil === opcao.valor ? 'selecionado' : ''}>
                <input
                  type="radio"
                  name="perfil"
                  value={opcao.valor}
                  checked={perfil === opcao.valor}
                  onChange={() => setPerfil(opcao.valor)}
                />
                {opcao.nome}
              </label>
            ))}
          </fieldset>

          <div className="campo">
            <label htmlFor="usuario">E-mail ou RA</label>
            <input
              id="usuario"
              type="text"
              autoComplete="username"
              placeholder="ex.: gabriel.freitas@escola.sp.gov.br"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              aria-invalid={!!erros.usuario}
            />
            {erros.usuario && <span className="login-erro">{erros.usuario}</span>}
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <div className="login-senha">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                aria-invalid={!!erros.senha}
              />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {erros.senha && <span className="login-erro">{erros.senha}</span>}
          </div>

          <div className="login-opcoes">
            <label>
              <input type="checkbox" /> Lembrar de mim
            </label>
            <a href="#">Esqueci minha senha</a>
          </div>

          <button className="botao login-botao" type="submit" disabled={entrando}>
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="login-dica">
            Protótipo: qualquer e-mail e senha (4+ caracteres) entram no perfil escolhido.
          </p>
        </form>
      </section>

    </div>
  );
}
