// =====================================================================
// dev-utils/generateInitialToken.js - token de teste SEM passar pelo login
//
// Útil para testar rotas protegidas no Insomnia/Postman/Thunder Client.
// Usa a MESMA função gerarToken() do login, então o token sai igualzinho
// ao que o POST /api/auth/login devolveria para esse usuário.
//
//   npm run token          -> token do admin (usuário 32, secretaria)
//   npm run token -- 12    -> token do usuário 12 (aluna Ana Souza)
//   npm run token -- 2     -> token do usuário 2  (prof. Ricardo Menezes)
//
// Depois envie no cabeçalho:  Authorization: Bearer <token>
// =====================================================================

import { pool } from '../config/database.js';
import * as UsuarioModel from '../models/UsuarioModel.js';
import { gerarToken } from '../utils/token.js';

const ID_ADMIN_PADRAO = 32;
const idUsuario = Number(process.argv[2] ?? ID_ADMIN_PADRAO);

try {
  const usuario = await UsuarioModel.buscarPorId(idUsuario);
  if (!usuario) {
    console.error(`Usuário ${idUsuario} não existe no banco.`);
    process.exitCode = 1;
  } else {
    console.log(`Token de ${usuario.nome} (${usuario.perfil}):\n`);
    console.log(gerarToken(usuario));
  }
} finally {
  await pool.end(); // fecha o pool para o script terminar
}
