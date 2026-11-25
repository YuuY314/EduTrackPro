import * as dbModule from '../config/database.js';
import { garantirAlunosDaTdp } from '../utils/permissoes.js';

// Suporta tanto o pool exportado diretamente quanto a fábrica criarPool()
const pool = typeof dbModule.criarPool === 'function' ? dbModule.criarPool() : dbModule.pool;

function hidratarNota(linha) {
  if (!linha) return null;
  return { ...linha, valor: Number(linha.valor) };
}

// 1. Listagem com paginação parametrizada
export async function listar({ limite, offset }) {
  const limiteNum = Number.parseInt(limite, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [linhas] = await pool.query(
    'SELECT * FROM notas ORDER BY id LIMIT ? OFFSET ?',
    [limiteNum, offsetNum]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM notas');

  return {
    notas: linhas.map(hidratarNota),
    total: Number(total)
  };
}

// 2. Busca por ID
export async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM notas WHERE id = ?', [id]);
  if (linhas.length === 0) return null;
  return hidratarNota(linhas[0]);
}

// 3. Inserção
export async function criar(nota) {
  const sql = 'INSERT INTO notas (id_avaliacao, id_aluno, valor) VALUES (?, ?, ?)';
  const valores = [nota.id_avaliacao, nota.id_aluno, nota.valor];
  const [resultado] = await pool.query(sql, valores);
  return { ...nota, id: resultado.insertId, imagem_url: null };
}

// 4. Atualização completa (PUT)
export async function atualizar(id, nota) {
  const sql = 'UPDATE notas SET id_avaliacao = ?, id_aluno = ?, valor = ? WHERE id = ?';
  const valores = [nota.id_avaliacao, nota.id_aluno, nota.valor, id];
  const [resultado] = await pool.query(sql, valores);
  return resultado.affectedRows > 0;
}

// 5. Atualizar URL da imagem (PATCH)
// export async function atualizarImagem(id, imagemUrl) {
//   const sql = 'UPDATE notas SET imagem_url = ? WHERE id = ?';
//   const [resultado] = await pool.query(sql, [imagemUrl, id]);
//   return resultado.affectedRows > 0;
// }

// 6. Remoção (DELETE)
export async function excluir(id) {
  const [resultado] = await pool.query('DELETE FROM notas WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

function posicaoDaNota(titulo, colunas = ['Prova 1', 'Prova 2', 'Trabalho']) {
  //direciona para a coluna (0, 1, 2) quando o titulo bate com o nome escrito no código
  const posicaoExata = colunas.indexOf(titulo);
  if (posicaoExata !== -1) return posicaoExata;
  //se o nome não bater por estar como nome antigo que já veio do banco de dados
  const texto = String(titulo || '').trim().toLowerCase();
  if (texto.startsWith('prova -') || texto === 'prova') return 0; 
  if (texto.startsWith('trabalho -') || texto === 'trabalho') return 2; 
  return -1;
}

//carega todas as avaliações e notas já lançadas
export async function buscarBoletim(id_tdp, bimestre) {
  const [avaliacoes] = await pool.query(
    //busca as avaliações já existentes no banco e se não existir nenhum retorna vazio
    'SELECT id_avaliacao, titulo, bimestre, peso FROM avaliacoes WHERE id_tdp = ? AND bimestre = ? ORDER BY id_avaliacao',
    [id_tdp, bimestre]
  );

  if (avaliacoes.length === 0) {
    return { avaliacoes: [], notas: [] };
  }

  const colunas = ['Prova 1', 'Prova 2', 'Trabalho'];
  const avaliacoesPorColuna = new Map();

  for (const a of avaliacoes) {
    const pos = posicaoDaNota(a.titulo, colunas);
    const tituloOficial = pos !== -1 ? colunas[pos] : a.titulo;
    if (!avaliacoesPorColuna.has(tituloOficial)) {
      avaliacoesPorColuna.set(tituloOficial, {
        ...a,
        titulo: tituloOficial,
      });
    }
  }
  //passa a avaliação pela função posicaoNota para renomear os nomes antigos do banco
  const avaliacoesAjustadas = Array.from(avaliacoesPorColuna.values());
  const idsAval = avaliacoesAjustadas.map((a) => a.id_avaliacao);

  const [notas] = await pool.query(
    //vai procurar a nota por id para atribiur ao aluno ao mesmo tempo convertendo para um número real
    'SELECT id, id_avaliacao, id_aluno, valor FROM notas WHERE id_avaliacao IN (?)',
    [idsAval]
  );

  return {
    avaliacoes: avaliacoesAjustadas,
    notas: notas.map(hidratarNota)
  };
}

//quando salvo grava a tabela no banco de uma só vez
export async function salvarBoletimCompleto({ id_tdp, bimestre, titulos, registros }) {
  //para garantir que o banco nunca fique salvo de forma incompleta ou corrompida se der qualquer erro no meio do caminho ele volta exatamente no estado em que estava antes de clicar em salvar
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    await garantirAlunosDaTdp(id_tdp, registros.map((r) => r.id_aluno), conexao);

    const pesosPorTitulo = {
      'Prova 1': 0.40,
      'Prova 2': 0.30,
      'Trabalho': 0.30,
    };

    const [existentes] = await conexao.query(
      'SELECT id_avaliacao, titulo FROM avaliacoes WHERE id_tdp = ? AND bimestre = ? ORDER BY id_avaliacao',
      [id_tdp, bimestre]
    );

    //verifica se já existem avaliações salvas para aquela turma e bimestre (atualizando o peso), caso não tenha cria e guarda o id gerado
    const mapaAval = new Map();
    for (const a of existentes) {
      const pos = posicaoDaNota(a.titulo, titulos);
      if (pos !== -1 && !mapaAval.has(titulos[pos])) {
        const tituloOficial = titulos[pos];
        mapaAval.set(tituloOficial, a.id_avaliacao);
        await conexao.query(
          'UPDATE avaliacoes SET peso = ? WHERE id_avaliacao = ?',
          [pesosPorTitulo[tituloOficial] ?? 1.00, a.id_avaliacao]
        );
      }
    }

    for (const titulo of titulos) {
      if (!mapaAval.has(titulo)) {
        const peso = pesosPorTitulo[titulo] ?? 1.00;
        const [resAval] = await conexao.query(
          'INSERT INTO avaliacoes (id_tdp, titulo, bimestre, peso) VALUES (?, ?, ?, ?)',
          [id_tdp, titulo, bimestre, peso]
        );
        mapaAval.set(titulo, resAval.insertId);
      }
    }

    //contador para gravar a quantidade de notas que foram salvas
    let totalSalvas = 0;
    //laço de fora percorre os alunos
    for (const reg of registros) {
      //laço de dentro percorre as colunas
      for (let i = 0; i < titulos.length; i++) {
        const id_avaliacao = mapaAval.get(titulos[i]);
        const valorRaw = reg.notas[i];

        //se o campo estiver vazio (se o professor apagar a nota) o registro é removido do banco
        if (valorRaw === '' || valorRaw === null || valorRaw === undefined) {
          await conexao.query(
            'DELETE FROM notas WHERE id_avaliacao = ? AND id_aluno = ?',
            [id_avaliacao, reg.id_aluno]
          );
        //serve para inserir uma nota nova ou alterar uma nota que já existe no banco
        } else {
          const valorNum = Number(valorRaw);
          await conexao.query(
            `INSERT INTO notas (id_avaliacao, id_aluno, valor)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
            [id_avaliacao, reg.id_aluno, valorNum]
          );
          totalSalvas++;
        }
      }
    }

    await conexao.commit();
    return { total_notas: totalSalvas };
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}