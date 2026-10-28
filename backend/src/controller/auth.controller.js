// =====================================================================
// controller/auth.controller.js
// CAMADA CONTROLLER: traduz HTTP <-> service. Faz só 3 coisas:
//   1) lê os dados da requisição (req.body, req.params, req.usuario);
//   2) chama o service;
//   3) devolve a resposta (res.status(...).json(...)).
// Nenhuma regra de negócio e nenhum SQL aqui.
// =====================================================================

export function criarAuthController({ authService }) {
  return {
    async login(req, res) {
      const resultado = await authService.login(req.body);
      res.json(resultado); // { token, usuario }
    },

    async me(req, res) {
      // req.usuario foi preenchido pelo middleware "autenticar"
      res.json(await authService.me(req.usuario.id_usuario));
    },

    async trocarSenha(req, res) {
      await authService.trocarSenha(req.usuario.id_usuario, req.body);
      res.status(204).end(); // 204 = deu certo, sem conteúdo para devolver
    },
  };
}
