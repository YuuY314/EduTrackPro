'use client';

// =====================================================================
// components/AreaProtegida.jsx - o "porteiro" das áreas logadas
//
// É o equivalente no front ao  if (!isset($_SESSION['id'])) header('Location: login.php');
// Fica em volta do layout de /admin, /professor e /aluno e:
//   1) sem login             -> manda para /login
//   2) perfil errado          -> manda para a área do próprio usuário
//                                (aluno digitando /admin volta para /aluno)
//   3) token vencido          -> limpa a sessão e manda para /login
//   4) pergunta ao backend (/auth/me) se o token ainda vale
//   5) deixa um "despertador" que desloga sozinho na hora em que o
//      token vence, mesmo que a pessoa esteja parada na página
//
// IMPORTANTE: o front só esconde as telas. Quem protege os DADOS é o
// backend (middleware autenticar), que recusa qualquer token inválido.
// =====================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/src/app/loading';
import { perfis } from '@/src/lib/dados';
import { api, lerSessao, msParaExpirar, sessaoExpirou } from '@/src/lib/api';

// O setTimeout do navegador não aceita esperar mais que ~24,8 dias.
const ESPERA_MAXIMA = 2_147_483_647;

export default function AreaProtegida({ perfil, children }) {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const sessao = lerSessao();

    // 1) Não fez login.
    if (!sessao?.token) {
      router.replace('/login');
      return;
    }

    // 2) Está logado, mas como outro perfil.
    if (sessao.usuario?.perfil !== perfil) {
      router.replace(perfis[sessao.usuario?.perfil]?.inicio ?? '/login');
      return;
    }

    // 3) O token já venceu (pela data gravada nele).
    if (msParaExpirar(sessao.token) <= 0) {
      sessaoExpirou();
      return;
    }

    // 5) Despertador: desloga quando o token vencer.
    let timer;
    function vigiar() {
      const restante = msParaExpirar(sessao.token);
      if (restante <= 0) sessaoExpirou();
      else timer = setTimeout(vigiar, Math.min(restante, ESPERA_MAXIMA));
    }
    vigiar();

    // 4) Confirma com o backend. Se ele responder 401, a api() já limpa a
    //    sessão e manda para o login. Outro erro (ex.: backend desligado)
    //    vai para a página de erro.
    let ativo = true;
    api('/auth/me')
      .then((usuario) => {
        if (!ativo) return;
        if (usuario.perfil !== perfil) router.replace(perfis[usuario.perfil].inicio);
        else setLiberado(true);
      })
      .catch((e) => {
        if (ativo && lerSessao()) setErro(e);
      });

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [perfil, router]);

  // Jogar o erro durante a renderização faz o Next mostrar o error.jsx.
  if (erro) throw erro;

  // Enquanto confere, mostra a tela de carregamento (nada da área vaza).
  if (!liberado) return <Loading />;

  return children;
}
