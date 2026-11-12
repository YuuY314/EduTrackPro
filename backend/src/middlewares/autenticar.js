// =====================================================================
// middlewares/autenticar.js - os "porteiros" das rotas protegidas
//
// autenticar      = equivalente ao  if (!isset($_SESSION['id']))  do PHP,
//                   mas olhando o TOKEN do cabeçalho:
//                   Authorization: Bearer eyJhbGciOi...
// exigirPerfil()  = "só entra quem for admin" (ou professor, ou aluno).
//
// Não existe controller/service de ADMIN porque admin não é uma tabela:
// é só um valor da coluna usuarios.perfil. A diferença entre os perfis
// é QUEM PODE acessar cada rota, e isso é papel deste middleware.
// =====================================================================

import { AppError } from '../utils/AppError.js';
import { verificarToken } from '../utils/token.js';

export function autenticar(req, _res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new AppError('Faça login para continuar.', 401);
  }

  // { sub, perfil, id_aluno?, id_professor?, iat, exp }
  req.usuario = verificarToken(token);
  next();
}

// Uso: router.delete('/:id', autenticar, exigirPerfil('admin'), controller.excluir)
export function exigirPerfil(...perfisPermitidos) {
  return (req, _res, next) => {
    if (!perfisPermitidos.includes(req.usuario?.perfil)) {
      throw new AppError('Você não tem permissão para isso.', 403);
    }
    next();
  };
}
