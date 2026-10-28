// =====================================================================
// middlewares/tratarErros.js
// Todo erro lançado no sistema (throw) acaba aqui e vira uma resposta
// HTTP padronizada: { "erro": "mensagem" }.
//
// No Express 5, erros em funções async são encaminhados para cá
// automaticamente. Por isso os controllers não precisam de try/catch.
// =====================================================================

import { AppError } from "../utils/AppError.js";

// Rota que não existe (registrada DEPOIS de todas as rotas, no app.js).
export function naoEncontrado(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// O Express reconhece um middleware de erro pelos 4 parâmetros (erro, req, res, next).
// O "next" precisa estar na lista mesmo sem uso.
export function tratarErros(erro, req, res, next) {
  // 1) Erro que nós mesmos lançamos (AppError) já traz status e mensagem.
  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  // 2) JSON malformado no corpo da requisição.
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição" });
  }

  // 3) Erros do MySQL. Cada um tem um "errno" (código numérico).
  if (erro.errno === 1062) {
    // Violou uma restrição UNIQUE (CPF, e-mail, matrícula repetidos...)
    return res.status(409).json({ erro: "Já existe um registro com esses dados (valor duplicado)" });
  }
  if (erro.errno === 1451) {
    // Tentou apagar algo que ainda é usado por outra tabela
    return res.status(409).json({ erro: "Este registro está em uso e não pode ser removido" });
  }
  if (erro.errno === 1452) {
    // Chave estrangeira inexistente (ex.: id_turma que não existe)
    return res.status(422).json({ erro: "Referência inválida: um dos ids informados não existe" });
  }
  if (erro.errno === 3819 || erro.errno === 4025) {
    // Violou um CHECK (nota fora de 0-10, bimestre fora de 1-4...)
    return res.status(422).json({ erro: "Valor fora do permitido pelo banco de dados" });
  }

  // 4) Qualquer outra coisa é bug nosso: logamos no servidor e
  //    devolvemos mensagem genérica (não vazamos detalhes ao cliente).
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor" });
}
