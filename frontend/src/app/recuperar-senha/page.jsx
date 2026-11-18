'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { solicitarRecuperacaoSenha } from '@/src/lib/api';
import '../login/login.css';

export default function RecuperarSenhaPage() {
  const [usuario, setUsuario] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();

    if (usuario.trim() === '') {
      setErro('Digite seu e-mail ou RA.');
      return;
    }

    setErro('');
    setEnviando(true);
    try {
      await solicitarRecuperacaoSenha({ login: usuario.trim() });
      setEnviado(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
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

      <section className="login-area">
        {enviado ? (
          <div className="login-form">
            <h2>Verifique seu e-mail</h2>
            <p className="login-subtitulo">
              Se existir uma conta para <strong>{usuario.trim()}</strong>, enviamos um link para criar uma nova senha.
            </p>

            <span className="login-sucesso" role="status">
              O link tem validade curta e só pode ser usado uma vez.
            </span>

            <p className="login-dica">
              Não chegou? Confira a caixa de spam ou envie de novo.
            </p>

            <button type="button" className="botao botao-contorno login-botao" onClick={() => setEnviado(false)}>
              Enviar de novo
            </button>

            <p className="login-voltar">
              <Link href="/login">Voltar para o login</Link>
            </p>
          </div>
        ) : (
          <form className="login-form" onSubmit={enviar} noValidate>
            <h2>Recuperar senha</h2>
            <p className="login-subtitulo">
              Informe seu e-mail ou RA. Vamos enviar um link para você criar uma nova senha.
            </p>

            <div className="campo">
              <label htmlFor="usuario">E-mail ou RA</label>
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                placeholder="ex.: ana.souza@aluno.escola.edu.br"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                aria-invalid={!!erro}
              />
              {erro && <span className="login-erro" role="alert">{erro}</span>}
            </div>

            <button className="botao login-botao" type="submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar link'}
            </button>

            <p className="login-voltar">
              <Link href="/login">Voltar para o login</Link>
            </p>
          </form>
        )}
      </section>

    </div>
  );
}
