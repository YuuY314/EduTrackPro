// =====================================================================
// middlewares/validacao.js
// Valida o corpo (req.body) das requisições com a biblioteca zod,
// ANTES de chegar no controller. Se algo estiver errado, responde 400
// dizendo qual campo falhou.
//
// Bônus: o zod descarta campos que não estão no schema, então o cliente
// não consegue "empurrar" colunas que não previmos.
// =====================================================================

import { z } from "zod";
import { AppError } from "../utils/AppError.js";

// Blocos reutilizáveis para montar os schemas das rotas.
export const campos = {
  id: z.number().int().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use o formato AAAA-MM-DD"),
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "use o formato HH:MM"),
  nota: z.number().min(0, "mínimo 0").max(10, "máximo 10"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "use o formato 000.000.000-00"),
  diaSemana: z.enum(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]),
};

// Uso nas rotas:  router.post("/", validar(schemaCriar), controller.criar)
export function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      // Junta todos os problemas em uma frase: "nome: Required; peso: ..."
      const detalhes = resultado.error.issues
        .map((i) => `${i.path.join(".") || "corpo"}: ${i.message}`)
        .join("; ");
      throw new AppError(`Dados inválidos - ${detalhes}`, 400);
    }

    req.body = resultado.data; // substitui pelo corpo já validado e "limpo"
    next();
  };
}

// Para rotas de ATUALIZAÇÃO (PUT): todos os campos viram opcionais, mas
// o cliente precisa mandar pelo menos um. Assim dá para alterar só o
// título de uma avaliação sem reenviar o resto.
export function parcial(schemaObjeto) {
  return schemaObjeto
    .partial()
    .refine((dados) => Object.keys(dados).length > 0, { message: "Informe ao menos um campo" });
}
