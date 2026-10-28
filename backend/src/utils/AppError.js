// =====================================================================
// utils/AppError.js
// Erro "esperado" com um código HTTP junto.
//
// Nos services fazemos:  throw new AppError("Turma não encontrada", 404)
// e o middleware tratarErros.js transforma isso em uma resposta HTTP
// { "erro": "Turma não encontrada" } com status 404.
// =====================================================================

export class AppError extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}
