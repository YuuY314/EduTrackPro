// =====================================================================
// scripts/definirSenhasDeTeste.js
// Os usuários do sistema_escolar.sql têm um "hash de exemplo" que não
// corresponde a nenhuma senha real, então ninguém conseguiria logar.
// Este script troca o hash de TODOS os usuários por um hash real da
// senha "123456", para você poder testar o login.
//
// Rode UMA vez depois de importar o SQL:   npm run seed:senhas
//
// ⚠ Só para desenvolvimento! Em produção, cada usuário tem a própria senha.
// =====================================================================

import { criarPool } from "../config/database.js";
import { gerarHash } from "../utils/senha.js";

const SENHA_DE_TESTE = "123456";

const pool = criarPool();
const hash = await gerarHash(SENHA_DE_TESTE);
const [resultado] = await pool.execute("UPDATE usuarios SET senha_hash = ?", [hash]);

console.log(`Senha "${SENHA_DE_TESTE}" definida para ${resultado.affectedRows} usuários.`);
await pool.end(); // fecha o pool para o script terminar
