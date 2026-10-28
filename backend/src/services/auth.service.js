// =====================================================================
// services/auth.service.js
// Regras de login: conferir senha, gerar token, trocar senha.
// =====================================================================

import { AppError } from "../utils/AppError.js";
import { gerarHash, senhaConfere } from "../utils/senha.js";
import { gerarToken } from "../utils/token.js";

export function criarAuthService({ usuariosModel }) {
  return {
    async login({ email, senha }) {
      const usuario = await usuariosModel.buscarPorEmail(email);

      // Mesma mensagem para "e-mail não existe" e "senha errada": assim
      // ninguém descobre quais e-mails estão cadastrados.
      if (!usuario || !(await senhaConfere(senha, usuario.senha_hash))) {
        throw new AppError("E-mail ou senha inválidos", 401);
      }

      // O que vai DENTRO do token. É assinado, mas NÃO é secreto (qualquer
      // um consegue ler), então nunca coloque senha ou dados sensíveis.
      const dados = { id_usuario: usuario.id_usuario, perfil: usuario.perfil };
      if (usuario.id_aluno) dados.id_aluno = usuario.id_aluno;
      if (usuario.id_professor) dados.id_professor = usuario.id_professor;

      return {
        token: gerarToken(dados),
        usuario: {
          id_usuario: usuario.id_usuario,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
        },
      };
    },

    // Dados do usuário logado (o front usa para montar o menu certo).
    async me(idUsuario) {
      const u = await usuariosModel.buscarPorId(idUsuario);
      if (!u) throw new AppError("Usuário não encontrado", 404);
      // Devolvemos tudo MENOS o hash da senha.
      const { senha_hash, ...seguro } = u;
      return seguro;
    },

    async trocarSenha(idUsuario, { senha_atual, nova_senha }) {
      const u = await usuariosModel.buscarPorId(idUsuario);
      if (!u) throw new AppError("Usuário não encontrado", 404);

      if (!(await senhaConfere(senha_atual, u.senha_hash))) {
        throw new AppError("Senha atual incorreta", 400);
      }
      await usuariosModel.atualizarSenha(idUsuario, await gerarHash(nova_senha));
    },
  };
}
