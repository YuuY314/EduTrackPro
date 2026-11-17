'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { redefinirSenha } from '@/src/lib/api';
import '../login/login.css';

const TAMANHO_MINIMO = 6;

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  // O link do e-mail traz ?token=... (lido só no navegador, como no login).
  // undefined = ainda hidratando; null = o link veio sem token.
  const token = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('token'),
    () => undefined,
  );

  async function salvar(evento) {
    evento.preventDefault();

    const novosErros = {};
    if (senha.length < TAMANHO_MINIMO) novosErros.senha = `A senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`;
    if (confirmar !== senha) novosErros.confirmar = 'As senhas não são iguais.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    try {
      await redefinirSenha({ token, senha });
      setConcluido(true);
    } catch (e) {
      setErros({ geral: e.message });
    } finally {
      setEnviando(false);
    }
  }

  let conteudo;

  if (token === null) {
    conteudo = (
      <div className="login-form">
        <h2>Link inválido</h2>
        <p className="login-subtitulo">Este link está incompleto. Peça um novo para continuar.</p>
        <Link href="/recuperar-senha" className="botao login-botao">Pedir novo link</Link>
      </div>
    );
  } else if (concluido) {
    conteudo = (
      <div className="login-form">
        <h2>Senha alterada</h2>
        <span className="login-sucesso" role="status">Pronto! Sua nova senha já vale.</span>
        <Link href="/login" className="botao login-botao">Ir para o login</Link>
      </div>
    );
  } else {
    conteudo = (
      <form className="login-form" onSubmit={salvar} noValidate>
        <h2>Nova senha</h2>
        <p className="login-subtitulo">Escolha uma senha com pelo menos {TAMANHO_MINIMO} caracteres.</p>

        <div className="campo">
          <label htmlFor="senha">Nova senha</label>
          <div className="login-senha">
            <input
              id="senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
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

        <div className="campo">
          <label htmlFor="confirmar">Confirmar nova senha</label>
          <input
            id="confirmar"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            aria-invalid={!!erros.confirmar}
          />
          {erros.confirmar && <span className="login-erro">{erros.confirmar}</span>}
        </div>

        {erros.geral && (
          <span className="login-erro" role="alert">
            {erros.geral} <Link href="/recuperar-senha" style={{ color: 'var(--link)' }}>Pedir novo link</Link>
          </span>
        )}

        <button className="botao login-botao" type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar nova senha'}
        </button>

        <p className="login-voltar">
          <Link href="/login">Voltar para o login</Link>
        </p>
      </form>
    );
  }

  return (
    <div className="login">

      <section className="login-marca">
        <div className="login-marca-conteudo">
          <Image src="/img/logo.svg" alt="" width={128} height={128} priority className="login-logo" />
          <h1>EduTrackPro</h1>
          <p>Notas, presença e agenda da escola num só lugar.</p>
        </div>
      </section>

      <section className="login-area">{conteudo}</section>

    </div>
  );
}
