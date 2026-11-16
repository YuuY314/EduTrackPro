import nodemailer from 'nodemailer';

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
