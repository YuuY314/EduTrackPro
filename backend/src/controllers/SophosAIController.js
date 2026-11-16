import { SophosAIService } from '../services/SophosAIService.js';

export class SophosAIController {
  static async conversar(req, res, next) {
    try {
      const { mensagem, historico } = req.body;

      const resultado = await SophosAIService.enviarMensagem({
        mensagem,
        historico,
        usuario: req.usuario, // Vem do middleware autenticar.js
      });

      return res.status(200).json(resultado);
    } catch (error) {
      next(error); // Repassa para o seu errorHandler.js
    }
  }
}