import React, { useEffect, useState } from 'react';
import { api, type Livro } from '../services/api';

export function GerenciarLivros() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);

  async function carregarLivros() {
    try {
      const response = await api.get('/livros');
      setLivros(response.data);
    } catch (error) {
      alert('Erro ao carregar livros');
    }
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !autor || !isbn) return alert('Preencha os campos obrigatórios!');

    try {
      await api.post('/livros', {
        titulo,
        autor,
        isbn,
        quantidade_disponivel: quantidade,
      });
      setTitulo('');
      setAutor('');
      setIsbn('');
      setQuantidade(1);
      carregarLivros();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao cadastrar livro');
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Deseja realmente remover este livro do acervo?')) return;
    try {
      await api.delete(`/livros/${id}`);
      carregarLivros();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir livro');
    }
  }

  useEffect(() => {
    carregarLivros();
  }, []);

  return (
    <section style={{ marginTop: '40px' }}>
      <h2>Cadastrar Novo Livro</h2>
      <form onSubmit={handleCadastrar} className="form-group">
        <input
          type="text"
          placeholder="Título do Livro"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Autor"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
        />
        <input
          type="text"
          placeholder="ISBN"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
        />
        <input
          type="number"
          placeholder="Qtd."
          min="1"
          style={{ maxWidth: '90px' }}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
        />
        <button type="submit">Cadastrar Livro</button>
      </form>

      <h2>Acervo de Livros</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Autor</th>
            <th>ISBN</th>
            <th>Disponível</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {livros.map((livro) => (
            <tr key={livro.id}>
              <td>{livro.id}</td>
              <td>{livro.titulo}</td>
              <td>{livro.autor}</td>
              <td>{livro.isbn}</td>
              <td>
                <span
                  style={{
                    color: livro.quantidade_disponivel > 0 ? '#16a34a' : '#dc2626',
                    fontWeight: 'bold',
                  }}
                >
                  {livro.quantidade_disponivel} un.
                </span>
              </td>
              <td>
                <button className="btn-danger" onClick={() => handleExcluir(livro.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
          {livros.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center' }}>
                Nenhum livro cadastrado no acervo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}