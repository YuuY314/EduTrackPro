import { api } from './api';

// POST /api/email/enviar é restrito ao admin: usa api(), que manda o token.
export async function enviarEmail({ to, subject, html, text }) {
    return await api('/email/enviar', {
        metodo: 'POST',
        corpo: { to, subject, html, text },
    });
}
