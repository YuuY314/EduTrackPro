import TituloPagina from '@/components/TituloPagina';
import Etiqueta from '@/components/Etiqueta';
import { turmas } from '@/lib/dados';

export const metadata = { title: 'Turmas · Sophos Academy' };

export default function TurmasAdmin() {
  return (
    <>
      <TituloPagina titulo="Turmas" voltarPara="/admin" voltarNome="Painel" />

      <div className="cartao tabela-rolagem tabela-larga tabela-escura">
        <table>
          <thead>
            <tr>
              <th>Turma</th>
              <th>Turno</th>
              <th>Sala</th>
              <th className="centro">Alunos</th>
              <th className="centro">Disciplinas sem professor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((t) => (
              <tr key={t.id}>
                <td>{t.nome}</td>
                <td>{t.turno}</td>
                <td>{t.sala}</td>
                <td className="centro">{t.alunos}</td>
                <td className="centro">
                  <Etiqueta cor={t.semProfessor ? 'atencao' : 'bom'}>{t.semProfessor}</Etiqueta>
                </td>
                <td><button className="botao botao-pequeno botao-contorno">Gerenciar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
