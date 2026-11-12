// =====================================================================
// utils/token.js - gera e confere o token JWT (o "crachá" do usuário)
//
// É a mesma ideia do dev-utils/generateInitialToken.js: um payload com
// { sub, perfil } assinado com o JWT_SECRET. A diferença é que aqui virou
// uma FUNÇÃO reaproveitável: o login usa, o script de dev usa e o
// middleware usa a verificarToken.
//
// ATENÇÃO: o conteúdo do token NÃO é secreto (qualquer um decodifica).
// Ele só não pode ser ALTERADO, porque a assinatura deixaria de bater.
// Nunca coloque senha ou dado sensível no payload.
// =====================================================================

import jwt from 'jsonwebtoken';

import { ambiente } from '../config/ambiente.js';
import { AppError } from './AppError.js';

// usuario = linha vinda de UsuarioModel.buscarPorId / buscarParaLogin
export function gerarToken(usuario, { lembrar = false } = {}) {
  const payload = {
    sub: usuario.id_usuario, // "subject": de quem é o token
    perfil: usuario.perfil,  // aluno | professor | admin
  };
  if (usuario.id_aluno) payload.id_aluno = usuario.id_aluno;
  if (usuario.id_professor) payload.id_professor = usuario.id_professor;

  return jwt.sign(payload, ambiente.jwtSegredo, {
    expiresIn: lembrar ? ambiente.jwtExpiraLembrar : ambiente.jwtExpira,
  });
}

// Devolve o payload se o token for válido; senão lança 401.
export function verificarToken(token) {
  try {
    return jwt.verify(token, ambiente.jwtSegredo, { algorithms: ['HS256'] });
  } catch {
    // adulterado, malformado ou vencido: para o cliente é tudo "inválido"
    throw new AppError('Sessão inválida ou expirada. Faça login novamente.', 401);
  }
}
