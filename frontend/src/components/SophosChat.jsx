'use client';

// =====================================================================
// components/SophosChat.jsx - chat da SophosAI (Gemini via backend)
//
// Fluxo: digita -> POST /api/sophos-ai/chat { mensagem, historico }
//        -> backend (autenticar -> SophosAIService -> Gemini) -> { resposta }
//
// O histórico é guardado no sessionStorage: dá para navegar pelas outras
// abas e voltar sem perder a conversa. Fechar o navegador/sair limpa tudo.
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import { CHAVE_CONVERSA_SOPHOS as CHAVE_CONVERSA, conversarComSophosAI } from '@/src/lib/api';
import Markdown from '@/src/components/Markdown';
import styles from './SophosChat.module.css';

const LIMITE = 4000;

const SUGESTOES = {
  aluno: [
    'Me explique equação do 2º grau com um exemplo',
    'Como organizar minha rotina de estudos para a prova?',
    'Resuma a Revolução Industrial em tópicos',
  ],
  professor: [
    'Sugira uma atividade em grupo sobre funções',
    'Como dar feedback construtivo em redações?',
    'Crie 5 questões de múltipla escolha sobre fotossíntese',
  ],
  admin: [
    'Como comunicar faltas excessivas aos responsáveis?',
    'Modelo de aviso sobre reunião de pais',
    'Ideias para melhorar a frequência dos alunos',
  ],
};

export default function SophosChat({ perfil }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregado, setCarregado] = useState(false);

  const fimRef = useRef(null);
  const campoRef = useRef(null);

  // Recupera a conversa guardada (só no navegador, por isso dentro do effect).
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_CONVERSA);
      if (salvo) setMensagens(JSON.parse(salvo));
    } catch {
      /* conversa corrompida: começa do zero */
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      sessionStorage.setItem(CHAVE_CONVERSA, JSON.stringify(mensagens));
    } catch {
      /* armazenamento cheio/bloqueado: segue sem persistir */
    }
  }, [mensagens, carregado]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens, enviando]);

  // Cresce o campo conforme o texto (até um limite).
  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;
    campo.style.height = 'auto';
    campo.style.height = `${Math.min(campo.scrollHeight, 160)}px`;
  }, [texto]);

  async function enviar(conteudo = texto) {
    const mensagem = conteudo.trim();
    if (!mensagem || enviando) return;

    // Histórico no formato do Gemini, SEM a mensagem nova e sem os erros.
    const historico = mensagens
      .filter((m) => !m.erro)
      .map((m) => ({ role: m.autor === 'usuario' ? 'user' : 'model', parts: [{ text: m.texto }] }));

    setMensagens((atual) => [...atual, { autor: 'usuario', texto: mensagem }]);
    setTexto('');
    setEnviando(true);

    try {
      const { resposta } = await conversarComSophosAI({ mensagem, historico });
      setMensagens((atual) => [...atual, { autor: 'sophos', texto: resposta }]);
    } catch (e) {
      setMensagens((atual) => [
        ...atual,
        { autor: 'sophos', texto: e.message || 'Não consegui responder agora.', erro: true },
      ]);
    } finally {
      setEnviando(false);
      campoRef.current?.focus();
    }
  }

  function aoDigitar(evento) {
    // Enter envia; Shift+Enter quebra a linha.
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      enviar();
    }
  }

  function novaConversa() {
    setMensagens([]);
    setTexto('');
    campoRef.current?.focus();
  }

  const vazio = carregado && mensagens.length === 0;

  return (
    <section className={`cartao ${styles.chat}`} aria-label="Conversa com a SophosAI">
      <div className={styles.topo}>
        <span className={styles.avatarIa} aria-hidden="true">
          <Brilho />
        </span>
        <div>
          <strong>SophosAI</strong>
          <small>Assistente de estudos · Gemini</small>
        </div>
        {mensagens.length > 0 && (
          <button type="button" className={`botao botao-contorno botao-pequeno ${styles.nova}`} onClick={novaConversa}>
            Nova conversa
          </button>
        )}
      </div>

      <div className={styles.mensagens} role="log" aria-live="polite">
        {vazio && (
          <div className={styles.vazio}>
            <span className={`${styles.avatarIa} ${styles.grande}`} aria-hidden="true">
              <Brilho />
            </span>
            <h2>Como posso ajudar?</h2>
            <p>Tire dúvidas de matérias, organize seus estudos ou peça ajuda para usar a plataforma.</p>
            <div className={styles.sugestoes}>
              {(SUGESTOES[perfil] ?? SUGESTOES.aluno).map((sugestao) => (
                <button key={sugestao} type="button" onClick={() => enviar(sugestao)} disabled={enviando}>
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m, i) => (
          <div key={i} className={`${styles.linha} ${m.autor === 'usuario' ? styles.eu : ''}`}>
            {m.autor === 'sophos' && (
              <span className={styles.avatarIa} aria-hidden="true">
                <Brilho />
              </span>
            )}
            <div className={`${styles.balao} ${m.erro ? styles.erro : ''}`}>
              {m.autor === 'sophos' && !m.erro ? <Markdown texto={m.texto} /> : <p>{m.texto}</p>}
            </div>
          </div>
        ))}

        {enviando && (
          <div className={styles.linha}>
            <span className={styles.avatarIa} aria-hidden="true">
              <Brilho />
            </span>
            <div className={`${styles.balao} ${styles.digitando}`} aria-label="SophosAI está digitando">
              <i /><i /><i />
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form
        className={styles.entrada}
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <textarea
          ref={campoRef}
          rows={1}
          value={texto}
          maxLength={LIMITE}
          placeholder="Pergunte alguma coisa para a SophosAI…"
          aria-label="Mensagem para a SophosAI"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={aoDigitar}
        />
        <button type="submit" className="botao" disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
      <p className={styles.aviso}>A SophosAI pode errar. Confirme informações importantes com seu professor.</p>
    </section>
  );
}

function Brilho() {
  return (
    <svg viewBox="0 0 24 24" width="55%" height="55%">
      <path
        fill="currentColor"
        d="M12 2l1.9 5.6a3 3 0 0 0 1.9 1.9L21.4 11.4 15.8 13.3a3 3 0 0 0-1.9 1.9L12 20.8l-1.9-5.6a3 3 0 0 0-1.9-1.9L2.6 11.4l5.6-1.9a3 3 0 0 0 1.9-1.9L12 2z"
      />
    </svg>
  );
}
