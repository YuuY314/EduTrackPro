'use client';

import { useEffect, useState } from 'react';
import CartaoNumero from '@/src/components/CartaoNumero';
import Agenda from '@/src/components/Agenda';
import LoadingTips from '@/src/components/LoadingTips';
import { buscarDashboardAluno } from '@/src/lib/api';

export default function InicioAluno() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    document.title = 'Início · EduTrackPro';
    let ativo = true;

    async function carregar() {
      try {
        const resultado = await buscarDashboardAluno();
        if (ativo) setDados(resultado);
      } catch (e) {
        if (ativo) setErro(e);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) throw erro;

  if (!dados) {
    return (
      <div className="inicio-aluno">
        <LoadingTips texto="Carregando seu painel..." />
      </div>
    );
  }
  return (
    <div className="inicio-aluno">
      <CartaoNumero numero={String(dados.pendencias)} texto="Pendências" />
      <CartaoNumero numero={String(dados.mensagensNaoLidas)} texto="Mensagens não lidas" href="#" />

      <div className="cartao cartao-conteudo agenda">
        <h3>Agenda</h3>
        <Agenda eventos={dados.eventos} />
      </div>

      <CartaoNumero
        numero="2"
        texto="Faltas"
        nota="Sua presença é muito importante."
        href="/aluno/presenca"
      />
      <CartaoNumero numero="Boletim" texto="e avaliações" href="/aluno/boletim" palavra />
    </div>
  );
}
