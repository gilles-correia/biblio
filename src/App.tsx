import React, { useEffect, useState } from 'react';
import { api, type Usuario, type Livro, type Emprestimo } from './services/api';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'cadastrar-usuario' | 'usuarios' | 'livros' | 'emprestimos'>('dashboard');

  // --- ESTADOS ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

  // Formulário Usuário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');

  // Formulário Livro
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);

  // Formulário Empréstimo
  const [usuarioSel, setUsuarioSel] = useState<number | ''>('');
  const [livroSel, setLivroSel] = useState<number | ''>('');

  // Busca e Filtros
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'ALUNO' | 'PROFESSOR'>('Todos');

  // Toasts
  const [toastMsg, setToastMsg] = useState<{ title: string; message: string; type: 'sucesso' | 'erro' } | null>(null);

  function mostrarToast(title: string, message: string, type: 'sucesso' | 'erro' = 'sucesso') {
    setToastMsg({ title, message, type });
    setTimeout(() => setToastMsg(null), 3500);
  }

  // --- CARREGAR DADOS ---
  async function carregarTudo() {
    try {
      const [uRes, lRes, eRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/livros'),
        api.get('/emprestimos')
      ]);
      setUsuarios(uRes.data);
      setLivros(lRes.data);
      setEmprestimos(eRes.data);
    } catch {
      mostrarToast('Erro de Conexão', 'Não foi possível carregar os dados da API.', 'erro');
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  // --- AÇÕES ---
  async function handleSalvarUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !email) return mostrarToast('Campos Incompletos', 'Preencha o nome e o e-mail.', 'erro');

    try {
      await api.post('/usuarios', { nome, email, tipo });
      setNome(''); setEmail('');
      carregarTudo();
      mostrarToast('Sucesso!', `${nome} foi cadastrado com sucesso.`);
      setAbaAtiva('usuarios');
    } catch {
      mostrarToast('Erro ao Salvar', 'Não foi possível cadastrar o usuário.', 'erro');
    }
  }

  async function handleInativarUsuario(id: number, nomeUser: string) {
    if (!confirm(`Confirmar inativação de ${nomeUser}?`)) return;
    try {
      await api.patch(`/usuarios/${id}/inativar`);
      carregarTudo();
      mostrarToast('Usuário Inativado', `${nomeUser} foi desativado.`);
    } catch {
      mostrarToast('Erro', 'Falha ao inativar usuário.', 'erro');
    }
  }

  async function handleSalvarLivro(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !autor || !isbn) return mostrarToast('Atenção', 'Preencha os dados do livro.', 'erro');

    try {
      await api.post('/livros', { titulo, autor, isbn, quantidade_disponivel: quantidade });
      setTitulo(''); setAutor(''); setIsbn(''); setQuantidade(1);
      carregarTudo();
      mostrarToast('Acervo Atualizado', `Livro "${titulo}" cadastrado!`);
      setAbaAtiva('livros');
    } catch {
      mostrarToast('Erro', 'Falha ao adicionar o livro.', 'erro');
    }
  }

  async function handleRealizarEmprestimo(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioSel || !livroSel) return mostrarToast('Atenção', 'Selecione um usuário e um livro.', 'erro');

    try {
      await api.post('/emprestimos', { usuario_id: usuarioSel, livro_id: livroSel, dias: 7 });
      setUsuarioSel(''); setLivroSel('');
      carregarTudo();
      mostrarToast('Empréstimo Concluído', 'Livro emprestado com sucesso!');
    } catch (err: any) {
      mostrarToast('Erro', err.response?.data?.error || 'Erro ao registrar empréstimo.', 'erro');
    }
  }

  async function handleDevolver(id: number) {
    try {
      await api.patch(`/emprestimos/${id}/devolver`);
      carregarTudo();
      mostrarToast('Devolução Concluída', 'Livro retornado ao acervo com sucesso!');
    } catch {
      mostrarToast('Erro', 'Falha ao registrar devolução.', 'erro');
    }
  }

  // --- FILTROS ---
  const usuariosFiltrados = usuarios.filter(u => {
    const bateTexto = u.nome.toLowerCase().includes(buscaUsuario.toLowerCase()) || u.email.toLowerCase().includes(buscaUsuario.toLowerCase());
    const bateTipo = filtroTipo === 'Todos' || u.tipo === filtroTipo;
    return bateTexto && bateTipo;
  });

  const totalAcervo = livros.reduce((acc, l) => acc + Number(l.quantidade_disponivel), 0);
  const totalEmprestados = emprestimos.filter(e => e.status === 'EMPRESTADO').length;

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col">
      
      {/* HEADER PRINCIPAL */}
      <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-blue-200 text-2xl shadow-inner">
                <i className="fa-solid fa-book-bookmark"></i>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">BiblioEscolar</h1>
                <p className="text-xs text-blue-200 font-medium hidden sm:block">Gestão Inteligente da Biblioteca</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15">
              <div className="w-8 h-8 rounded-full bg-blue-400 text-brand-900 font-bold flex items-center justify-center text-sm shadow">
                AB
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold leading-tight">Ana Beatriz</p>
                <p className="text-[10px] text-blue-200 leading-tight">Bibliotecária</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* NAVEGAÇÃO POR ABAS */}
        <div className="border-b border-slate-200 mb-8 bg-white rounded-t-2xl px-4 pt-2 shadow-sm">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setAbaAtiva('dashboard')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                abaAtiva === 'dashboard' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-chart-pie text-base"></i>
              <span>Dashboard / Início</span>
            </button>

            <button
              onClick={() => setAbaAtiva('cadastrar-usuario')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                abaAtiva === 'cadastrar-usuario' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-user-plus text-base"></i>
              <span>Cadastrar Usuário</span>
            </button>

            <button
              onClick={() => setAbaAtiva('usuarios')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                abaAtiva === 'usuarios' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-users text-base"></i>
              <span>Usuários Ativos</span>
              <span className="ml-1.5 bg-blue-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {usuarios.length}
              </span>
            </button>

            <button
              onClick={() => setAbaAtiva('livros')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                abaAtiva === 'livros' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-book text-base"></i>
              <span>Acervo de Livros</span>
            </button>

            <button
              onClick={() => setAbaAtiva('emprestimos')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                abaAtiva === 'emprestimos' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-right-left text-base"></i>
              <span>Empréstimos</span>
            </button>
          </nav>
        </div>

        {/* ABA 1: DASHBOARD */}
        {abaAtiva === 'dashboard' && (
          <div className="animate-fadeIn">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total de Usuários</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{usuarios.length}</h3>
                  <p className="text-xs text-emerald-600 mt-1 font-medium"><i class="fa-solid fa-arrow-up text-[10px]"></i> Cadastrados no banco</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-book-reader"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Empréstimos Ativos</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalEmprestados}</h3>
                  <p className="text-xs text-indigo-600 mt-1 font-medium"><i className="fa-solid fa-clock"></i> Circulação atual</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Títulos em Acervo</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{livros.length}</h3>
                  <p className="text-xs text-amber-600 mt-1 font-medium"><i className="fa-solid fa-book"></i> Livros registrados</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-layer-group text-2xl"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Exemplares</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalAcervo}</h3>
                  <p className="text-xs text-emerald-600 mt-1 font-medium"><i className="fa-solid fa-check"></i> Disponíveis para empréstimo</p>
                </div>
              </div>
            </div>

            {/* Acesso Rápido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 lg:col-span-1">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-bolt text-amber-500"></i> Acesso Rápido
                </h2>
                <div className="space-y-3">
                  <button onClick={() => setAbaAtiva('cadastrar-usuario')} className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <i className="fa-solid fa-user-plus"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-brand-600">Novo Usuário</h4>
                      <p className="text-xs text-slate-500">Cadastrar aluno ou professor</p>
                    </div>
                  </button>

                  <button onClick={() => setAbaAtiva('emprestimos')} className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <i className="fa-solid fa-right-left"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-brand-600">Empréstimos</h4>
                      <p className="text-xs text-slate-500">Registrar e devolver livros</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 lg:col-span-2 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-bullhorn text-brand-500"></i> Informes da Biblioteca
                  </h2>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <i className="fa-solid fa-circle-info text-brand-500 mt-0.5"></i>
                      <span>O prazo padrão para empréstimos é de <strong>7 dias úteis</strong> para Alunos e <strong>15 dias</strong> para Professores.</span>
                    </li>
                    <li className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <i className="fa-solid fa-circle-check text-emerald-500 mt-0.5"></i>
                      <span>Todos os registros de usuários e acervo estão integrados diretamente com o banco MariaDB.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Conectado ao MariaDB (biblioteca_db)</span>
                  <span>Sistema v2.4</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: CADASTRO DE USUÁRIO */}
        {abaAtiva === 'cadastrar-usuario' && (
          <div className="animate-fadeIn max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-id-card text-brand-600"></i> Cadastrar Novo Usuário
                </h2>
                <p className="text-xs text-slate-500 mt-1">Preencha as informações do leitor para liberação de empréstimos.</p>
              </div>

              <form onSubmit={handleSalvarUsuario} className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Nome Completo *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i className="fa-solid fa-user"></i>
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Lucas Gabriel Silva"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">E-mail *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i className="fa-solid fa-envelope"></i>
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="usuario@escola.edu.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Perfil / Tipo *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i className="fa-solid fa-user-tag"></i>
                      </span>
                      <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as 'ALUNO' | 'PROFESSOR')}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                      >
                        <option value="ALUNO">Aluno</option>
                        <option value="PROFESSOR">Professor</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-check"></i> Salvar Cadastro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ABA 3: CONSULTAR USUÁRIOS */}
        {abaAtiva === 'usuarios' && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={buscaUsuario}
                    onChange={(e) => setBuscaUsuario(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-slate-500 font-medium">Filtrar por:</span>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value as any)}
                    className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-700 font-medium"
                  >
                    <option value="Todos">Todos os Perfis</option>
                    <option value="ALUNO">Alunos</option>
                    <option value="PROFESSOR">Professores</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4 sm:px-6">ID</th>
                      <th className="py-3.5 px-4 sm:px-6">Nome / E-mail</th>
                      <th className="py-3.5 px-4 sm:px-6">Tipo</th>
                      <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {usuariosFiltrados.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-mono text-xs font-bold text-slate-600">#{u.id}</td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-semibold text-slate-800">{u.nome}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            u.tipo === 'ALUNO' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {u.tipo}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <button
                            onClick={() => handleInativarUsuario(u.id, u.nome)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Inativar Usuário"
                          >
                            <i className="fa-solid fa-user-minus"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: ACERVO DE LIVROS */}
        {abaAtiva === 'livros' && (
          <div className="animate-fadeIn space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-plus-circle text-brand-600"></i> Adicionar Livro ao Acervo
              </h2>
              <form onSubmit={handleSalvarLivro} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Título do Livro"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <input
                  type="text"
                  placeholder="Autor"
                  required
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <input
                  type="text"
                  placeholder="ISBN"
                  required
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qtd."
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="w-24 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <button type="submit" className="flex-1 bg-brand-600 text-white font-semibold text-sm rounded-xl hover:bg-brand-700 transition-all">
                    Salvar
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Título</th>
                    <th className="py-3.5 px-6">Autor</th>
                    <th className="py-3.5 px-6">ISBN</th>
                    <th className="py-3.5 px-6 text-center">Disponível</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {livros.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">#{l.id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{l.titulo}</td>
                      <td className="py-4 px-6 text-slate-600">{l.autor}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">{l.isbn}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          l.quantidade_disponivel > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {l.quantidade_disponivel} un.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 5: EMPRÉSTIMOS E DEVOLUÇÕES */}
        {abaAtiva === 'emprestimos' && (
          <div className="animate-fadeIn space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-right-left text-brand-600"></i> Registrar Novo Empréstimo
              </h2>
              <form onSubmit={handleRealizarEmprestimo} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={usuarioSel}
                  onChange={(e) => setUsuarioSel(Number(e.target.value))}
                  className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">Selecione o Leitor...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>

                <select
                  value={livroSel}
                  onChange={(e) => setLivroSel(Number(e.target.value))}
                  className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">Selecione o Livro...</option>
                  {livros.filter(l => l.quantidade_disponivel > 0).map(l => (
                    <option key={l.id} value={l.id}>{l.titulo} ({l.quantidade_disponivel} disp.)</option>
                  ))}
                </select>

                <button type="submit" className="bg-brand-600 text-white font-semibold text-sm rounded-xl hover:bg-brand-700 transition-all py-2.5">
                  Confirmar Empréstimo
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Leitor</th>
                    <th className="py-3.5 px-6">Livro</th>
                    <th className="py-3.5 px-6">Devolução Prevista</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {emprestimos.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">#{emp.id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{emp.usuario_nome} ({emp.usuario_tipo})</td>
                      <td className="py-4 px-6 text-slate-600">{emp.livro_titulo}</td>
                      <td className="py-4 px-6 text-slate-500">{new Date(emp.data_prevista_devolucao).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          emp.status === 'EMPRESTADO' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {emp.status === 'EMPRESTADO' && (
                          <button
                            onClick={() => handleDevolver(emp.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Devolver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* TOAST DE NOTIFICAÇÃO */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            toastMsg.type === 'sucesso' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <i className={`fa-solid ${toastMsg.type === 'sucesso' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          </div>
          <div>
            <h4 className="text-sm font-semibold">{toastMsg.title}</h4>
            <p className="text-xs text-slate-300">{toastMsg.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}
