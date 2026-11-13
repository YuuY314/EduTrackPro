// =====================================================================
// middlewares/errorHandler.js - respostas de erro padronizadas
//
// Toda resposta de erro da API tem o formato { "erro": "..." }.
// No Express 5, erros lançados em funções async chegam aqui sozinhos,
// por isso os controllers NÃO precisam de try/catch.
// =====================================================================

import { AppError } from '../utils/AppError.js';

// Erros do MySQL que são "culpa do cliente", não bug do servidor.
const ERROS_MYSQL = {
  ER_DUP_ENTRY: [409, 'Já existe um cadastro com esses dados (e-mail, CPF ou matrícula).'],
  ER_ROW_IS_REFERENCED_2: [409, 'Não é possível remover: o registro está em uso.'],
  ER_NO_REFERENCED_ROW_2: [422, 'Referência inválida (turma, responsável... não existe).'],
};

// Nenhuma rota casou com a URL pedida.
export function notFound(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// O Express reconhece um middleware de erro pelos 4 parâmetros.
export function errorHandler(erro, _req, res, _next) {
  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  if (ERROS_MYSQL[erro.code]) {
    const [status, mensagem] = ERROS_MYSQL[erro.code];
    return res.status(status).json({ erro: mensagem });
  }

  // Qualquer outra coisa é bug nosso: loga no servidor e responde com
  // mensagem genérica (não vazamos detalhes internos para o cliente).
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
}
