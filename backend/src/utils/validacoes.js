// =====================================================================
// utils/validacoes.js - validações reaproveitadas por todos os services
//
// Substituem as classes models/Aluno.js, Professores.js e Usuario.js,
// que repetiam o mesmo "if" várias vezes (e tinham bugs: checavam
// "nome" no lugar do campo certo e exigiam um ID antes de o registro
// existir).
// =====================================================================

import { AppError } from './AppError.js';

// Converte "12" em 12 e rejeita "abc", "-3", "1.5", "".
export function paraId(valor, nome = 'id') {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(`Parâmetro "${nome}" inválido.`, 400);
  }
  return numero;
}

// Confere se os campos de texto vieram preenchidos e devolve uma cópia
// com tudo "trimado". Campos fora da lista são ignorados (o cliente não
// consegue, por exemplo, mandar "perfil": "admin" escondido no body).
//
//   lerTextos(req.body, { obrigatorios: ['nome', 'cpf'], opcionais: ['telefone'] })
export function lerTextos(dados = {}, { obrigatorios = [], opcionais = [] }) {
  const resultado = {};

  for (const campo of obrigatorios) {
    const valor = dados[campo];
    if (typeof valor !== 'string' || valor.trim() === '') {
      throw new AppError(`O campo "${campo}" é obrigatório.`, 400);
    }
    resultado[campo] = valor.trim();
  }

  for (const campo of opcionais) {
    const valor = dados[campo];
    if (valor === undefined) continue;
    if (valor !== null && typeof valor !== 'string') {
      throw new AppError(`O campo "${campo}" deve ser texto.`, 400);
    }
    resultado[campo] = valor?.trim() || null;
  }

  return resultado;
}

// ?pagina=2&limite=10  ->  { pagina: 2, limite: 10, offset: 10 }
export function lerPaginacao({ pagina = 1, limite = 10 } = {}) {
  const p = Number(pagina);
  const l = Number(limite);
  if (!Number.isInteger(p) || p <= 0) {
    throw new AppError('"pagina" deve ser um inteiro positivo.', 400);
  }
  if (!Number.isInteger(l) || l < 1 || l > 100) {
    throw new AppError('"limite" deve ser um inteiro entre 1 e 100.', 400);
  }
  return { pagina: p, limite: l, offset: (p - 1) * l };
}

export function montarPaginacao({ pagina, limite }, total) {
  return { pagina, limite, total, totalPaginas: Math.ceil(total / limite) };
}
