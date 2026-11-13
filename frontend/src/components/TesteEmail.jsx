
'use client';

import { useState } from 'react';
import { enviarEmail } from '../lib/email.js';

export default function TesteEmail() {
    const [email, setEmail] = useState('');
    const [assunto, setAssunto] = useState('');
    const [conteudo, setConteudo] = useState('');

    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [sucesso, setSucesso] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setCarregando(true);
        setMensagem('');

        try {
            await enviarEmail({
                to: email,
                subject: assunto,
                text: conteudo,
                html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${conteudo
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')}</div>`
            });

            setSucesso(true);
            setMensagem('E-mail enviado com sucesso!');

            setEmail('');
            setAssunto('');
            setConteudo('');

        } catch (erro) {
            setSucesso(false);
            setMensagem(erro.message);

        } finally {
            setCarregando(false);
        }
    }

    return (
        <main className="container">
            <h1 className="titulo-pagina">Teste de envio de e-mail</h1>

            <p className="caminho">
                Ferramentas / Envio de e-mail
            </p>

            <div className="cartao">
                <div className="cartao-titulo escuro">
                    Nova mensagem
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="cartao-conteudo">
                        <div className="formulario">
                            <div className="campo largo">
                                <label htmlFor="email">
                                    Destinatário
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="destinatario@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="campo largo">
                                <label htmlFor="assunto">
                                    Assunto
                                </label>

                                <input
                                    id="assunto"
                                    type="text"
                                    placeholder="Assunto do e-mail"
                                    value={assunto}
                                    onChange={(e) => setAssunto(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="campo">
                            <label htmlFor="conteudo">
                                Mensagem
                            </label>

                            <textarea
                                id="conteudo"
                                placeholder="Digite sua mensagem..."
                                value={conteudo}
                                onChange={(e) => setConteudo(e.target.value)}
                                rows={10}
                                required
                            />
                        </div>

                        {mensagem && (
                            <p
                                className={sucesso ? 'mensagem' : 'mensagem-erro'}
                                role="status"
                            >
                                {mensagem}
                            </p>
                        )}
                    </div>

                    <div className="cartao-rodape">
                        <button
                            type="reset"
                            className="botao botao-contorno"
                            onClick={() => {
                                setEmail('');
                                setAssunto('');
                                setConteudo('');
                                setMensagem('');
                            }}
                        >
                            Limpar
                        </button>

                        <button
                            type="submit"
                            className="botao"
                            disabled={carregando}
                        >
                            {carregando ? 'Enviando...' : 'Enviar e-mail'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
