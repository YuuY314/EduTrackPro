import { GoogleGenAI } from '@google/genai';
import { ambiente } from '../config/ambiente.js';
import { AppError } from '../utils/AppError.js';

const ai = new GoogleGenAI({ apiKey: ambiente.geminiApiKey });

const LIMITE_MENSAGEM = 4000; // caracteres por mensagem
const LIMITE_HISTORICO = 2;   // últimas N mensagens enviadas ao Gemini

// Aceita só o formato do Gemini ({ role: 'user'|'model', parts: [{ text }] }),
// limita o tamanho e garante que o histórico comece com 'user' (exigência da API).
function limparHistorico(historico) {
  if (!Array.isArray(historico)) return [];

  const limpo = historico
    .filter((m) => (m?.role === 'user' || m?.role === 'model') && typeof m?.parts?.[0]?.text === 'string')
    .map((m) => ({ role: m.role, parts: [{ text: m.parts[0].text.slice(0, LIMITE_MENSAGEM) }] }))
    .slice(-LIMITE_HISTORICO);

  while (limpo.length && limpo[0].role !== 'user') limpo.shift();
  return limpo;
}

const CRASES = '```';

const REGRAS_GRAFICOS = `
GRÁFICOS: quando um gráfico ajudar a explicar, NUNCA desenhe com texto, ASCII ou tabelas de caracteres.
Use um bloco de código com a linguagem "grafico" contendo APENAS JSON válido, em uma única linha, sem comentários.
Explique o gráfico em texto antes ou depois do bloco, nunca dentro dele.

Tipos aceitos:

1) "barras", "linha" ou "pizza" (use "nome" e "valor" em cada item de "dados"):
${CRASES}grafico
{"tipo":"barras","titulo":"Notas por matéria","dados":[{"nome":"Mat","valor":8},{"nome":"Port","valor":7}]}
${CRASES}

2) "funcao" (expressão em x, usando ^, *, /, sqrt(), sin(), cos(), abs(), log()):
${CRASES}grafico
{"tipo":"funcao","titulo":"y = x² - 4x + 3","expressao":"x^2 - 4*x + 3","xMin":-2,"xMax":6}
${CRASES}

Limites: no máximo 12 itens em "dados". Use o gráfico só quando ele realmente ajudar.
`;

// ---------------------------------------------------------------------------
// Tratamento de erros do Gemini
// ---------------------------------------------------------------------------

// O ApiError do SDK traz o corpo do Google como JSON dentro de error.message.
// Aqui extraímos o status HTTP, o status do Google (ex.: RESOURCE_EXHAUSTED) e o detalhe.
function lerErroGemini(error) {
  const status = Number(error?.status ?? error?.code) || null;
  const codigoRede = error?.cause?.code ?? (typeof error?.code === 'string' ? error.code : '');

  let statusGoogle = '';
  let detalhe = error?.message ?? String(error);
  try {
    const corpo = JSON.parse(error.message);
    statusGoogle = corpo?.error?.status ?? '';
    detalhe = corpo?.error?.message ?? detalhe;
  } catch {
    /* a mensagem não era JSON (ex.: erro de rede) */
  }

  return { status, statusGoogle, detalhe, codigoRede };
}

// Converte o erro em AppError com mensagem clara para o usuário, sempre indicando o código.
// IMPORTANTE: o status HTTP devolvido ao front nunca é 401/403, porque o front pode
// interpretar isso como "sessão expirada" e deslogar o usuário. Esses casos viram 502.
function traduzirErroGemini(error) {
  const { status, statusGoogle, detalhe, codigoRede } = lerErroGemini(error);

  console.error(
    `[SophosAI] Gemini falhou | status=${status ?? 'sem status'} google=${statusGoogle || '-'} ` +
      `rede=${codigoRede || '-'} modelo=${ambiente.geminiModelo} | ${detalhe}`
  );

  const sufixo = status ? ` (erro ${status})` : codigoRede ? ` (${codigoRede})` : '';

  // Sem status HTTP: o servidor nem chegou ao Google.
  if (!status) {
    return new AppError(
      `Não foi possível conectar ao Gemini. Verifique a internet do servidor.${sufixo}`,
      502
    );
  }

  if (status === 400) {
    if (/API key|API_KEY/i.test(detalhe)) {
      return new AppError(`A chave do Gemini configurada no servidor é inválida.${sufixo}`, 502);
    }
    if (statusGoogle === 'FAILED_PRECONDITION') {
      return new AppError(
        `O Gemini não está disponível para essa chave (região não suportada ou faturamento não habilitado).${sufixo}`,
        502
      );
    }
    return new AppError(`O Gemini recusou a requisição por formato inválido.${sufixo}`, 502);
  }

  if (status === 401) {
    return new AppError(`A chave do Gemini não foi aceita pelo Google.${sufixo}`, 502);
  }

  if (status === 403) {
    return new AppError(
      `A chave do Gemini não tem permissão para esse modelo, ou a API não está habilitada.${sufixo}`,
      502
    );
  }

  if (status === 404) {
    return new AppError(
      `O modelo "${ambiente.geminiModelo}" não está disponível para essa chave. Troque o GEMINI_MODEL.${sufixo}`,
      502
    );
  }

  if (status === 408 || status === 504) {
    return new AppError(`O Gemini demorou demais para responder. Tente novamente.${sufixo}`, 504);
  }

  if (status === 429) {
    return new AppError(
      `O limite de uso da SophosAI foi atingido. Aguarde alguns minutos e tente de novo.${sufixo}`,
      429
    );
  }

  if (status === 500) {
    return new AppError(`O Gemini teve um erro interno. Tente novamente em instantes.${sufixo}`, 502);
  }

  if (status === 503) {
    return new AppError(`A SophosAI está com muita demanda agora. Tente novamente em instantes.${sufixo}`, 503);
  }

  return new AppError(`Falha ao se comunicar com a SophosAI. Tente novamente em instantes.${sufixo}`, 502);
}

// ---------------------------------------------------------------------------

export class SophosAIService {
  static async enviarMensagem({ mensagem, historico = [], usuario }) {
    if (typeof mensagem !== 'string' || !mensagem.trim()) {
      throw new AppError('A mensagem não pode estar vazia.', 400);
    }

    if (mensagem.length > LIMITE_MENSAGEM) {
      throw new AppError(`A mensagem pode ter no máximo ${LIMITE_MENSAGEM} caracteres.`, 400);
    }

    if (!ambiente.geminiApiKey) {
      throw new AppError('Chave da API do Gemini não configurada no servidor.', 500);
    }

    try {
      // Personaliza o contexto com base no perfil autenticado (aluno, professor, admin)
      const contextoUsuario = usuario
        ? `Você está conversando com um usuário de perfil "${usuario.perfil}".`
        : '';

      const chat = ai.chats.create({
        model: ambiente.geminiModelo,
        history: limparHistorico(historico),
        config: {
          systemInstruction: `Você é a SophosAI, a assistente virtual inteligente da plataforma SophosAcademy.
          ${contextoUsuario}
          Seu objetivo é ajudar com dúvidas de estudo, organização escolar, matérias do ensino médio e uso da plataforma.
          Seja clara, didática, objetiva e responda sempre em português.
          ${REGRAS_GRAFICOS}`,
        },
      });

      const response = await chat.sendMessage({ message: mensagem });

      // O Gemini pode responder 200 sem texto (ex.: conteúdo bloqueado pelos filtros de segurança).
      if (!response.text?.trim()) {
        const motivo = response.promptFeedback?.blockReason ?? response.candidates?.[0]?.finishReason ?? 'desconhecido';
        console.error(`[SophosAI] Resposta vazia do Gemini | motivo=${motivo}`);
        throw new AppError(
          `A SophosAI não conseguiu gerar uma resposta para essa mensagem. Tente reformular a pergunta. (${motivo})`,
          422
        );
      }

      return { resposta: response.text };
    } catch (error) {
      if (error instanceof AppError) throw error; // não retraduz o erro de resposta vazia
      throw traduzirErroGemini(error);
    }
  }
}