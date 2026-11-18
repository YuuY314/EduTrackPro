import { GoogleGenAI } from '@google/genai';
import { ambiente } from '../config/ambiente.js';
import { AppError } from '../utils/AppError.js';

const ai = new GoogleGenAI({ apiKey: ambiente.geminiApiKey });

const LIMITE_MENSAGEM = 4000; // caracteres por mensagem
const LIMITE_HISTORICO = 20;  // últimas N mensagens enviadas ao Gemini

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
          Seja clara, didática, objetiva e responda sempre em português.`,
        },
      });

      const response = await chat.sendMessage({ message: mensagem });

      return {
        resposta: response.text,
      };
    } catch (error) {
      console.error('Erro na integração com Gemini:', error);
      throw new AppError('Falha ao se comunicar com a SophosAI. Tente novamente em instantes.', 502);
    }
  }
}