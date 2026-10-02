import React, { useEffect, useState } from 'react';
import { api, type Usuario, type Livro, type Emprestimo } from './services/api';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState<'usuarios' | 'livros' | 'emprestimos'>('usuarios');

  // --- ESTADOS DE USUÁRIOS ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');

  // --- ESTADOS DE LIVROS ---
  const [livros, setLivros] = useState<Livro[]>([]);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);

  // --- ESTADOS DE EMPRÉSTIMOS ---
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | ''>('');
  const [livroSelecionado, setLivroSelecionado] = useState<number | ''>('');
  const [diasDevolucao, setDiasDevolucao] = useState<number>(7);

  // --- CARREGAMENTO DE DADOS ---
  async function carregarUsuarios() {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch { alert('Erro ao carregar usuários.'); }
  }

  async function carregarLivros() {
    try {
      const res = await api.get('/livros');
      setLivros(res.data);
    } catch { alert('Erro ao carregar livros.'); }
  }

  async function carregarEmprestimos() {
    try {
      const res = await api.get('/emprestimos');
      setEmprestimos(res.data);
    } catch { alert('Erro ao carregar empréstimos.'); }
  }

  // --- AÇÕES DE EMPRÉSTIMO ---
  async function handleRealizarEmprestimo(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioSelecionado || !livroSelecionado) return alert('Selecione um usuário e um livro!');

    try {
      await api.post('/emprestimos', {
        usuario_id: Number(usuarioSelecionado),
        livro_id: Number(livroSelecionado),
        dias: diasDevolucao
      });
      setUsuarioSelecionado('');
      setLivroSelecionado('');
      setDiasDevolucao(7);
      carregarEmprestimos();
      carregarLivros(); // Atualiza estoque na tela de livros
      alert('Empréstimo realizado!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registrar empréstimo.');
    }
  }

  async function handleDevolver(id: number) {
    if (!confirm('Confirmar a devolução deste livro?')) return;
    try {
      await api.patch(`/emprestimos/${id}/devolver`);
      carregarEmprestimos();
      carregarLivros();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registrar devolução.');
    }
  }

  // --- AÇÕES DE USUÁRIOS E LIVROS ---
  async function handleCadastrarUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !email) return alert('Preencha os campos!');
    try {
      await api.post('/usuarios', { nome, email, tipo });
      setNome(''); setEmail('');
      carregarUsuarios();
    } catch { alert('Erro ao cadastrar usuário.'); }
  }

  async function handleInativarUsuario(id: number) {
    if (!confirm('Deseja inativar este usuário?')) return;
    try {
      await api.patch(`/usuarios/${id}/inativar`);
      carregarUsuarios();
    } catch { alert('Erro ao inativar usuário.'); }
  }

  async function handleCadastrarLivro(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !autor || !isbn) return alert('Preencha os campos!');
    try {
      await api.post('/livros', { titulo, autor, isbn, quantidade_disponivel: quantidade });
      setTitulo(''); setAutor(''); setIsbn(''); setQuantidade(1);
      carregarLivros();
    } catch { alert('Erro ao cadastrar livro.'); }
  }

  async function handleExcluirLivro(id: number) {
    if (!confirm('Deseja remover este livro?')) return;
    try {
      await api.delete(`/livros/${id}`);
      carregarLivros();
    } catch (error: any) { alert(error.response?.data?.error || 'Erro ao excluir.'); }
  }

  useEffect(() => {
    if (abaAtiva === 'usuarios') carregarUsuarios();
    if (abaAtiva === 'livros') carregarLivros();
    if (abaAtiva === 'emprestimos') {
      carregarEmprestimos();
      carregarUsuarios();
      carregarLivros();
    }
  }, [abaAtiva]);

  return (
    <div className="container">
      <h1>Sistema de Biblioteca Escolar</h1>

      {/* Menu Principal */}
      <div className="tabs-container">
        <button
          className={abaAtiva === 'usuarios' ? 'active' : ''}
          onClick={() => setAbaAtiva('usuarios')}
        >
          Usuários
        </button>
        <button
          className={abaAtiva === 'livros' ? 'active' : ''}
          onClick={() => setAbaAtiva('livros')}
        >
          Livros (Acervo)
        </button>
        <button
          className={abaAtiva === 'emprestimos' ? 'active' : ''}
          onClick={() => setAbaAtiva('emprestimos')}
        >
          Empréstimos e Devoluções
        </button>
      </div>

      {/* ABA 1: USUÁRIOS */}
      {abaAtiva === 'usuarios' && (
        <>
          <section style={{ marginBottom: '40px' }}>
            <h2>Cadastrar Usuário</h2>
            <form onSubmit={handleCadastrarUsuario} className="form-group">
              <input type="text" placeholder="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} />
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor</option>
              </select>
              <button type="submit">Cadastrar</button>
            </form>
          </section>

          <section>
            <h2>Consultar Usuários Ativos</h2>
            <table>
              <thead>
                <tr><th>ID</th><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td>{u.nome}</td><td>{u.email}</td><td><strong>{u.tipo}</strong></td>
                    <td><button className="btn-danger" onClick={() => handleInativarUsuario(u.id)}>Inativar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* ABA 2: LIVROS */}
      {abaAtiva === 'livros' && (
        <>
          <section style={{ marginBottom: '40px' }}>
            <h2>Cadastrar Novo Livro</h2>
            <form onSubmit={handleCadastrarLivro} className="form-group">
              <input type="text" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              <input type="text" placeholder="Autor" value={autor} onChange={(e) => setAutor(e.target.value)} />
              <input type="text" placeholder="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
              <input type="number" min="1" style={{ maxWidth: '90px' }} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              <button type="submit">Cadastrar Livro</button>
            </form>
          </section>

          <section>
            <h2>Acervo de Livros</h2>
            <table>
              <thead>
                <tr><th>ID</th><th>Título</th><th>Autor</th><th>ISBN</th><th>Disponível</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {livros.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td><td>{l.titulo}</td><td>{l.autor}</td><td>{l.isbn}</td>
                    <td><strong style={{ color: l.quantidade_disponivel > 0 ? '#16a34a' : '#dc2626' }}>{l.quantidade_disponivel} un.</strong></td>
                    <td><button className="btn-danger" onClick={() => handleExcluirLivro(l.id)}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* ABA 3: EMPRÉSTIMOS E DEVOLUÇÕES */}
      {abaAtiva === 'emprestimos' && (
        <>
          <section style={{ marginBottom: '40px' }}>
            <h2>Novo Empréstimo</h2>
            <form onSubmit={handleRealizarEmprestimo} className="form-group">
              <select value={usuarioSelecionado} onChange={(e) => setUsuarioSelecionado(Number(e.target.value))}>
                <option value="">Selecione o Usuário...</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                ))}
              </select>

              <select value={livroSelecionado} onChange={(e) => setLivroSelecionado(Number(e.target.value))}>
                <option value="">Selecione o Livro...</option>
                {livros.filter(l => l.quantidade_disponivel > 0).map((l) => (
                  <option key={l.id} value={l.id}>{l.titulo} ({l.quantidade_disponivel} disp.)</option>
                ))}
              </select>

              <input 
                type="number" 
                placeholder="Prazo (dias)" 
                style={{ maxWidth: '120px' }} 
                value={diasDevolucao} 
                onChange={(e) => setDiasDevolucao(Number(e.target.value))} 
              />

              <button type="submit">Emprestar</button>
            </form>
          </section>

          <section>
            <h2>Histórico de Empréstimos</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Livro</th>
                  <th>Data Devolução Prevista</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {emprestimos.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.usuario_nome} ({emp.usuario_tipo})</td>
                    <td>{emp.livro_titulo}</td>
                    <td>{new Date(emp.data_prevista_devolucao).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className={`badge ${emp.status === 'EMPRESTADO' ? 'badge-warning' : 'badge-success'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      {emp.status === 'EMPRESTADO' && (
                        <button 
                          style={{ backgroundColor: '#16a34a' }} 
                          onClick={() => handleDevolver(emp.id)}
                        >
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {emprestimos.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>Nenhum empréstimo registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}