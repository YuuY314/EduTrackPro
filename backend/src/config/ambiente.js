// 
// config/ambiente.js
// Lê as variáveis de ambiente (.env) UMA vez, valida e exporta um objeto
// organizado. O resto do sistema importa daqui em vez de usar
// process.env espalhado pelo código.
//
// Vantagem: se faltar alguma variável obrigatória, o servidor nem sobe
// e avisa qual está faltando (falhar cedo é melhor que falhar no meio).
// Carrega o arquivo .env para dentro de process.env.
// (Precisa rodar ANTES de qualquer leitura de process.env.)
import "dotenv/config";

// Variáveis sem as quais o sistema não funciona.
// DB_PASS não entra na lista porque o MySQL local pode ter senha vazia.
const obrigatorias = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME", "JWT_SECRET"];

const faltando = obrigatorias.filter((nome) => !process.env[nome]);
if (faltando.length > 0) {
  throw new Error(`Variáveis de ambiente faltando no .env: ${faltando.join(", ")}`);
}

export const ambiente = {
  porta: Number(process.env.PORT) || 3000,

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    pass: process.env.DB_PASS || "",
    nome: process.env.DB_NAME,
  },

  jwt: {
    segredo: process.env.JWT_SECRET,
    expira: process.env.JWT_EXPIRES || "8h", // quanto tempo o login vale
  },
};
