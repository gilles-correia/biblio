import React, { useEffect, useState } from 'react';
import { api, type Livro } from '../services/api';

export function GerenciarLivros() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  async function carregarLivros() {
    try {
      setLoading(true);
      const response = await api.get<Livro[]>('/livros');
      setLivros(response.data);
    } catch {
      alert('Erro ao carregar livros');
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !autor.trim() || !isbn.trim()) {
      return alert('Preencha os campos obrigatórios!');
    }

    try {
      await api.post('/livros', {
        titulo: titulo.trim(),
        autor: autor.trim(),
        isbn: isbn.trim(),
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

  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    carregarLivros();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* FORMULÁRIO DE CADASTRO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-plus-circle text-blue-600"></i> Cadastrar Novo Livro
        </h2>
        <form onSubmit={handleCadastrar} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Título do Livro"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <input
            type="text"
            placeholder="Autor"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <input
            type="text"
            placeholder="ISBN"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Qtd."
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className="w-24 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-sm"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>

      {/* TABELA DE ACERVO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-book-bookmark text-blue-600"></i> Acervo de Livros
          </h2>
          <span className="text-xs text-slate-500 font-medium">Total: {livros.length} títulos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Título</th>
                <th className="py-3.5 px-6">Autor</th>
                <th className="py-3.5 px-6">ISBN</th>
                <th className="py-3.5 px-6 text-center">Disponível</th>
                <th className="py-3.5 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {livros.map((livro) => (
                <tr key={livro.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500">#{livro.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{livro.titulo}</td>
                  <td className="py-4 px-6 text-slate-600">{livro.autor}</td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">{livro.isbn}</td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        livro.quantidade_disponivel > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {livro.quantidade_disponivel} un.
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleExcluir(livro.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}

              {livros.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum livro cadastrado no acervo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}