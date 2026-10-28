/* =========================================================
   SOPHOS ACADEMY — interações
   Cada bloco só roda se a página tiver os elementos dele.
   ========================================================= */


/* ---------- Header: botão ☰ do celular ---------- */
const header = document.querySelector('.header');
const botaoMenu = document.querySelector('.botao-menu');

if (botaoMenu) {
  botaoMenu.addEventListener('click', () => {
    header.classList.toggle('menu-aberto');
  });
}


/* ---------- Header: menu do usuário ---------- */
const botaoUsuario = document.querySelector('.usuario-botao');
const menuUsuario = document.querySelector('.usuario-menu');

if (botaoUsuario) {
  botaoUsuario.addEventListener('click', (evento) => {
    evento.stopPropagation();
    menuUsuario.hidden = !menuUsuario.hidden;
  });

  // fecha ao clicar fora
  document.addEventListener('click', () => {
    menuUsuario.hidden = true;
  });
}


/* ---------- Funções úteis ---------- */

// Devolve a classe de cor de uma nota: bom (7+), atencao (5 a 6,9), ruim (abaixo de 5)
function corDaNota(nota) {
  if (nota >= 7) return 'bom';
  if (nota >= 5) return 'atencao';
  return 'ruim';
}

// Mostra "Salvo às 08:45" num elemento
function mostrarSalvo(elemento, texto) {
  const agora = new Date();
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  elemento.textContent = `${texto} às ${hora}`;
}


/* ---------- Professor: chamada ---------- */
const botoesPresenca = document.querySelectorAll('.botao-presenca');

botoesPresenca.forEach((botao) => {
  botao.addEventListener('click', () => {
    const faltou = botao.classList.toggle('falta');
    botao.textContent = faltou ? 'Falta' : 'Presente';
    atualizarContagem();
  });
});

function atualizarContagem() {
  const faltas = document.querySelectorAll('.botao-presenca.falta').length;
  const presentes = botoesPresenca.length - faltas;
  document.getElementById('contagem').textContent =
    `${presentes} presentes · ${faltas} ${faltas === 1 ? 'falta' : 'faltas'}`;
}

const salvarChamada = document.getElementById('salvar-chamada');
if (salvarChamada) {
  salvarChamada.addEventListener('click', () => {
    mostrarSalvo(document.getElementById('mensagem-chamada'), 'Chamada salva');
  });
}


/* ---------- Professor: notas (média automática) ---------- */
document.querySelectorAll('.campo-nota').forEach((campo) => {
  campo.addEventListener('input', () => {
    const linha = campo.closest('tr');
    const campos = linha.querySelectorAll('.campo-nota');
    const celulaMedia = linha.querySelector('.media');

    const notas = [...campos].map((c) => c.value);

    // se alguma nota estiver vazia, ainda não dá para calcular
    if (notas.includes('')) {
      celulaMedia.innerHTML = '<span class="etiqueta vazio">–</span>';
      return;
    }

    const soma = notas.reduce((total, n) => total + Number(n), 0);
    const media = soma / notas.length;
    celulaMedia.innerHTML =
      `<span class="etiqueta ${corDaNota(media)}">${media.toFixed(1)}</span>`;
  });
});

const salvarNotas = document.getElementById('salvar-notas');
if (salvarNotas) {
  salvarNotas.addEventListener('click', () => {
    mostrarSalvo(document.getElementById('mensagem-notas'), 'Notas salvas');
  });
}


/* ---------- Admin: busca e cadastro de alunos ---------- */
const busca = document.getElementById('busca');
const filtroTurno = document.getElementById('filtro-turno');

function filtrarAlunos() {
  const texto = busca.value.toLowerCase();
  const turno = filtroTurno.value;

  document.querySelectorAll('#lista-alunos tr').forEach((linha) => {
    const bateTexto = linha.textContent.toLowerCase().includes(texto);
    const bateTurno = turno === '' || linha.dataset.turno === turno;
    linha.hidden = !(bateTexto && bateTurno);
  });
}

if (busca) {
  busca.addEventListener('input', filtrarAlunos);
  filtroTurno.addEventListener('change', filtrarAlunos);
}

const formAluno = document.getElementById('form-aluno');
if (formAluno) {
  document.getElementById('novo-aluno').addEventListener('click', () => {
    formAluno.hidden = false;
    document.getElementById('nome').focus();
  });

  document.getElementById('cancelar-aluno').addEventListener('click', () => {
    formAluno.reset();
    formAluno.hidden = true;
  });

  formAluno.addEventListener('submit', (evento) => {
    evento.preventDefault(); // no sistema real, aqui envia para o servidor

    const nome = document.getElementById('nome').value;
    const [turma, turno] = document.getElementById('turma-aluno').value.split(' · ');

    const linha = document.createElement('tr');
    linha.dataset.turno = turno;
    linha.innerHTML = `
      <td>Nova</td>
      <td>${nome}</td>
      <td>${turma}<small>${turno}</small></td>
      <td class="centro">–</td>
      <td class="centro"><span class="etiqueta vazio">Novo</span></td>
      <td><button class="botao botao-pequeno botao-contorno">Editar</button></td>`;
    document.getElementById('lista-alunos').prepend(linha);

    formAluno.reset();
    formAluno.hidden = true;
  });
}


/* ---------- Admin: lembrete para professor ---------- */
document.querySelectorAll('.botao-lembrete').forEach((botao) => {
  botao.addEventListener('click', () => {
    botao.textContent = 'Lembrete enviado';
    botao.disabled = true;
  });
});


/* ---------- Admin: calendário ---------- */
const formEvento = document.getElementById('form-evento');

if (formEvento) {
  formEvento.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const data = new Date(document.getElementById('data-evento').value + 'T12:00');
    const tipo = document.getElementById('tipo-evento').value;
    const descricao = document.getElementById('descricao-evento').value;

    const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    let semana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    semana = semana[0].toUpperCase() + semana.slice(1); // "sex" → "Sex"

    const item = document.createElement('div');
    item.className = 'evento';
    item.innerHTML = `
      <time>${dia}<small>${semana}</small></time>
      <div>
        <strong>${tipo}</strong>
        ${descricao ? `<p>${descricao}</p>` : ''}
      </div>`;
    document.getElementById('lista-eventos').append(item);

    document.getElementById('descricao-evento').value = '';
    document.getElementById('mensagem-evento').textContent = 'Data adicionada à agenda dos alunos';
  });
}
