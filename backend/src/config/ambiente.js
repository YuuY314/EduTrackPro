// =====================================================================
// config/ambiente.js - lê o .env UMA vez e entrega tudo pronto
//
// Qualquer arquivo que precise de configuração importa { ambiente }.
// No Docker não existe .env (as variáveis vêm do docker-compose), por
// isso a falta do arquivo não é erro; a falta de uma variável é.
// =====================================================================

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Calcula o caminho do backend/.env a partir deste arquivo (src/config),
// não a partir da pasta onde o comando foi rodado.
const arquivoEnv = fileURLToPath(new URL('../../.env', import.meta.url));

if (existsSync(arquivoEnv)) process.loadEnvFile(arquivoEnv);
// DB_PASSWORD fica de fora: no XAMPP a senha do root é vazia ("").
const obrigatorias = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const ausentes = obrigatorias.filter((nome) => !process.env[nome]?.trim());

if (ausentes.length > 0) {
  throw new Error(`Configure no .env: ${ausentes.join(', ')}`);
}

export const ambiente = {
  porta: Number(process.env.PORT) || 8080,
  modo: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  },

  jwtSegredo: process.env.JWT_SECRET,
  jwtExpira: process.env.JWT_EXPIRES || '8h',          // login normal
  jwtExpiraLembrar: process.env.JWT_EXPIRES_LEMBRAR || '30d', // "Lembrar de mim"
};
