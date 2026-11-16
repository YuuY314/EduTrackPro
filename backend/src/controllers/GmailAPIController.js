import * as GmailAPIService from '../services/GmailAPIService.js';

function responderErro(erro, res, next) {
    if (erro instanceof TypeError) {
        return res.status(400).json({
            erro: erro.message
        });
    }

    return next(erro);
}

export async function enviar(req, res, next) {
    try {
        const { to, subject, html, text } = req.body;

        const resultado = await GmailAPIService.enviar({
            to,
            subject,
            html,
            text
        });

        return res.status(200).json({
            mensagem: 'E-mail enviado com sucesso!',
            resultado
        });

    } catch (erro) {
        return responderErro(erro, res, next);
    }
}
