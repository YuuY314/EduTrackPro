import nodemailer from 'nodemailer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,

    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

export async function enviar({ to, subject, html, text }) {
    if (!to || !subject || (!html && !text)) {
        throw new TypeError('Destinatário, assunto e conteúdo são obrigatórios.');
    }

    const resultado = await transporter.sendMail({
        from: `"EduTrackPro" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        text
    });

    return {
        messageId: resultado.messageId,
        accepted: resultado.accepted,
        rejected: resultado.rejected
    };
}

function escaparHTML(valor = '') {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Lê templates/<arquivo>, escapa as variáveis e troca cada {{chave}}.
// "cruas" são trechos de HTML montados aqui no servidor (já escapados)
// e que, por isso, não podem ser escapados de novo.
async function renderizarTemplate(arquivo, variaveis, cruas = {}) {
    const caminhoTemplate = path.resolve(__dirname, '../templates', arquivo);

    let html = await fs.readFile(caminhoTemplate, 'utf8');

    const todas = { ano: new Date().getFullYear(), ...variaveis };

    for (const [chave, valor] of Object.entries(todas)) {
        html = html.replaceAll(`{{${chave}}}`, escaparHTML(valor));
    }

    for (const [chave, valor] of Object.entries(cruas)) {
        html = html.replaceAll(`{{${chave}}}`, valor);
    }

    return html;
}

async function gerarTemplateRecuperacao({ nome, link, validade, logoUrl }) {
    return renderizarTemplate('recuperarSenha.html', { nome, link, validade, logoUrl });
}

export async function enviarEmailRecuperacao({
    to,
    nome,
    token,
    validade = '30 minutos'
}) {
    const frontendUrl = process.env.FRONTEND_URL;
    const logoUrl = process.env.LOGO_URL;

    if (!frontendUrl || !logoUrl) {
        throw new Error('FRONTEND_URL ou LOGO_URL não configurada.');
    }

    const urlBase = new URL(frontendUrl);

    if (!['http:', 'https:'].includes(urlBase.protocol)) {
        throw new Error('Protocolo da URL do frontend inválido.');
    }

    const link = new URL('/redefinir-senha', urlBase);
    link.searchParams.set('token', token);

    const html = await gerarTemplateRecuperacao({
        nome,
        link: link.toString(),
        validade,
        logoUrl
    });

    return enviar({
        to,
        subject: 'Redefinição de senha - EduTrackPro',
        html,
        text: `Olá, ${nome}. Acesse ${link.toString()} para redefinir sua senha. O link expira em ${validade}.`
    });
}

// Lembrete de notas pendentes (botão "Enviar lembrete" da área do admin).
// pendencias: [{ disciplina, turma }]
export async function enviarEmailLembreteNotas({ to, nome, bimestre, pendencias }) {
    const frontendUrl = process.env.FRONTEND_URL;
    const logoUrl = process.env.LOGO_URL;

    if (!frontendUrl || !logoUrl) {
        throw new Error('FRONTEND_URL ou LOGO_URL não configurada.');
    }

    const link = new URL('/professor/notas', frontendUrl).toString();

    const itens = pendencias
        .map((p) => `<li style="margin:0 0 4px;">${escaparHTML(p.disciplina)} &ndash; turma ${escaparHTML(p.turma)}</li>`)
        .join('');

    const html = await renderizarTemplate(
        'lembreteNotas.html',
        { nome, bimestre, link, logoUrl },
        { listaPendencias: `<ul style="margin:0; padding-left:20px;">${itens}</ul>` }
    );

    const textoPendencias = pendencias
        .map((p) => `- ${p.disciplina} (turma ${p.turma})`)
        .join('\n');

    return enviar({
        to,
        subject: `Lembrete: notas do ${bimestre}º bimestre - EduTrackPro`,
        html,
        text: `Olá, ${nome}. Ainda faltam notas do ${bimestre}º bimestre:\n${textoPendencias}\nLance em ${link}`
    });
}
