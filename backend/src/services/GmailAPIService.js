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

async function gerarTemplateRecuperacao({ nome, link, validade, logoUrl }) {
    const caminhoTemplate = path.resolve(
        __dirname,
        '../templates/recuperarSenha.html'
    );

    let html = await fs.readFile(caminhoTemplate, 'utf8');

    const variaveis = {
        nome: escaparHTML(nome),
        link: escaparHTML(link),
        validade: escaparHTML(validade),
        logoUrl: escaparHTML(logoUrl),
        ano: new Date().getFullYear()
    };

    for (const [chave, valor] of Object.entries(variaveis)) {
        html = html.replaceAll(`{{${chave}}}`, String(valor));
    }

    return html;
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
