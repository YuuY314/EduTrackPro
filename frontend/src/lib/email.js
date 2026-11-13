const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function enviarEmail({ to, subject, html, text }) {
    const resposta = await fetch(`${API_URL}/email/enviar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to,
            subject,
            html,
            text
        })
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            resultado.erro || 'Não foi possível enviar o e-mail.'
        );
    }

    return resultado;
}