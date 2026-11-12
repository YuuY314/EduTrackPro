'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { perfis } from '@/src/lib/dados';
import { login } from '@/src/lib/api';
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
  const [lembrar, setLembrar] = useState(false);
  const [erros, setErros] = useState({});
  const [entrando, setEntrando] = useState(false);

  // O porteiro (AreaProtegida) manda para /login?motivo=expirou quando o token vence.
  // Lê o "?motivo=" da URL só no navegador (no servidor não existe window).
  const motivo = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('motivo'),
    () => null,
  );
  const aviso = motivo === 'expirou' ? 'Sua sessão expirou. Faça login novamente.' : '';

  async function entrar(evento) {
    evento.preventDefault();

    const novosErros = {};
    if (usuario.trim() === '') novosErros.usuario = 'Digite seu e-mail ou RA.';
    if (senha === '') novosErros.senha = 'Digite sua senha.';
    else if (senha.length < 4) novosErros.senha = 'A senha precisa ter pelo menos 4 caracteres.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEntrando(true);
    try {
      const respostaSessao = await login({ login: usuario.trim(), senha, perfil, lembrar });
      console.log('✅ CONEXÃO COM BACKEND FUNCIONOU!');
      console.log('Dados recebidos do backend:', respostaSessao);

      const logado = respostaSessao.usuario;
      router.push(perfis[logado.perfil].inicio);
    } catch (erro) {

      console.error('❌ ERRO AO CONECTAR:', erro.message);

      setErros({ geral: erro.message });
      setEntrando(false);
    }
  }

  return (
    <div className="login">

      <section className="login-marca">
        <div className="login-marca-conteudo">
          <Image src="/img/logo.svg" alt="" width={128} height={128} priority className='login-logo' />
          <h1>EduTrackPro</h1>
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
              placeholder="ex.: ana.souza@aluno.escola.edu.br"
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
              <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} /> Lembrar de mim
            </label>
            <a href="#">Esqueci minha senha</a>
          </div>

          {aviso && !erros.geral && <span className="login-aviso" role="status">{aviso}</span>}
          {erros.geral && <span className="login-erro" role="alert">{erros.geral}</span>}

          <button className="botao login-botao" type="submit" disabled={entrando}>
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="login-dica">
            Teste: ana.souza@aluno.escola.edu.br, ricardo.menezes@escola.edu.br ou secretaria@escola.edu.br, senha 123456.
          </p>
        </form>
      </section>

    </div>
  );
}